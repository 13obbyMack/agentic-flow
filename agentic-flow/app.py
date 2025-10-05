from flask import Flask, jsonify, request

app = Flask(__name__)

# Sample in-memory data store
users = []

# GET endpoint to retrieve all users
@app.route('/users', methods=['GET'])
def get_users():
    return jsonify(users)

# POST endpoint to create a new user
@app.route('/users', methods=['POST'])
def create_user():
    user = request.get_json()
    users.append(user)
    return jsonify(user)

# PUT endpoint to update an existing user
@app.route('/users/<id>', methods=['PUT'])
def update_user(id):
    user = request.get_json()
    for u in users:
        if u['id'] == int(id):
            u.update(user)
            return jsonify(user)
    return jsonify({'error': 'User not found'}), 404

if __name__ == '__main__':
    app.run(debug=True)