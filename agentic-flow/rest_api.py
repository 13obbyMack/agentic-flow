from flask import Flask, jsonify
app = Flask(__name__)

@app.route('/users', methods=['GET'])
def get_users):
    users = [{'id': 1, 'name': 'John'}, {'id': 2, 'name': 'Jane'}]
    return jsonify(users)

@app.route('/products', methods=['GET'])
def get_products):
    products = [{'id': 1, 'name': 'Product 1'}, {'id': 2, 'name': 'Product 2'}]
    return jsonify(products)

if __name__ == '__main__):
    app.run(port=5000)