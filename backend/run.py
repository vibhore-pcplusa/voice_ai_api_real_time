from app import app, socketio

if __name__ == '__main__':
    print("Starting Voice AI API server...")
    socketio.run(app, debug=False, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)
