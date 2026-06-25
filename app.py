from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import sys
import os

# Добавляем путь к HdRezkaApi
sys.path.append(os.path.dirname(__file__))

from HdRezkaApi import HdRezkaApi, HdRezkaSearch

app = Flask(__name__, static_folder='frontend', static_url_path='')
CORS(app)

# Путь к фронтенду
FRONTEND_PATH = os.path.join(os.path.dirname(__file__), 'frontend')

# Попробуем разные зеркала
HDREZKA_MIRRORS = [
    "https://hdrezka.ag",
    "https://hdrezka.co",
    "https://hdrezka.in",
    "https://rezka.ag",
]

def get_working_mirror():
    for mirror in HDREZKA_MIRRORS:
        try:
            import requests
            r = requests.get(mirror, timeout=5)
            if r.status_code == 200:
                return mirror
        except:
            continue
    return HDREZKA_MIRRORS[0]

HDREZKA_ORIGIN = get_working_mirror()
print(f"Using mirror: {HDREZKA_ORIGIN}")


@app.route('/')
def index():
    return send_from_directory(FRONTEND_PATH, 'index.html')


@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(FRONTEND_PATH, filename)


@app.route('/api/search', methods=['GET'])
def search():
    query = request.args.get('q', '')
    if not query:
        return jsonify({'error': 'Query parameter is required'}), 400
    
    try:
        searcher = HdRezkaSearch(HDREZKA_ORIGIN)
        results = searcher(query)
        return jsonify({'success': True, 'results': results})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/item', methods=['GET'])
def get_item():
    url = request.args.get('url', '')
    if not url:
        return jsonify({'error': 'URL parameter is required'}), 400
    
    try:
        rezka = HdRezkaApi(url)
        
        item_info = {
            'url': url,
            'id': rezka.id,
            'name': rezka.name,
            'names': rezka.names,
            'origName': rezka.origName,
            'origNames': rezka.origNames,
            'description': rezka.description,
            'thumbnail': rezka.thumbnail,
            'thumbnailHQ': rezka.thumbnailHQ,
            'releaseYear': rezka.releaseYear,
            'type': str(rezka.type),
            'category': str(rezka.category),
            'rating': {
                'value': rezka.rating.value if hasattr(rezka.rating, 'value') else None,
                'votes': rezka.rating.votes if hasattr(rezka.rating, 'votes') else None
            },
            'translators': rezka.translators,
            'otherParts': rezka.otherParts
        }
        
        if rezka.type == 'tv_series':
            item_info['seriesInfo'] = rezka.seriesInfo
            item_info['episodesInfo'] = rezka.episodesInfo
        
        return jsonify({'success': True, 'item': item_info})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/stream', methods=['GET'])
def get_stream():
    url = request.args.get('url', '')
    season = request.args.get('season')
    episode = request.args.get('episode')
    translation = request.args.get('translation')
    
    if not url:
        return jsonify({'error': 'URL parameter is required'}), 400
    
    try:
        rezka = HdRezkaApi(url)
        
        params = {}
        if translation:
            params['translation'] = translation
        
        if rezka.type == 'tv_series':
            if not season or not episode:
                return jsonify({'error': 'Season and episode are required'}), 400
            stream = rezka.getStream(season=season, episode=episode, **params)
        else:
            stream = rezka.getStream(**params)
        
        stream_info = {
            'name': stream.name,
            'season': stream.season,
            'episode': stream.episode,
            'translator_id': stream.translator_id,
            'videos': stream.videos
        }
        
        if stream.subtitles:
            stream_info['subtitles'] = {
                'subtitles': stream.subtitles.subtitles,
                'keys': stream.subtitles.keys
            }
        
        return jsonify({'success': True, 'stream': stream_info})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    app.run(debug=debug, port=port, host='0.0.0.0')
