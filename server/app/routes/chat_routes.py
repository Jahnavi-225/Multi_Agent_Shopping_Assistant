import time
import json
from flask import Blueprint, request, jsonify, Response
from app.agents.rag_chat_agent import RAGChatAgent

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/message', methods=['POST'])
def chat_message():
    data = request.get_json() or {}
    message = data.get('message', '')
    history = data.get('history', [])

    if not message:
        return jsonify({"error": "Message text is required"}), 400

    response_data = RAGChatAgent.generate_response(message, history)
    return jsonify({
        "status": "success",
        "reply": response_data["text"],
        "deep_links": response_data["deep_links"]
    })

@chat_bp.route('/stream', methods=['POST'])
def chat_stream():
    data = request.get_json() or {}
    message = data.get('message', '')

    if not message:
        return jsonify({"error": "Message is required"}), 400

    response_data = RAGChatAgent.generate_response(message)
    full_text = response_data["text"]
    deep_links = response_data["deep_links"]

    def generate():
        # Stream text token by token / chunk by chunk
        words = full_text.split(" ")
        for i in range(0, len(words), 2):
            chunk = " ".join(words[i:i+2]) + " "
            yield f"data: {json.dumps({'chunk': chunk, 'done': False})}\n\n"
            time.sleep(0.04)

        yield f"data: {json.dumps({'done': True, 'deep_links': deep_links})}\n\n"

    return Response(generate(), mimetype='text/event-stream')
