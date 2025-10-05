<bash_command>pip install flask</bash_command>

from flask import Flask, jsonify

def create_app():
 app = Flask(__name__)
 app.route('/', methods=['GET'])(lambda: jsonify({'message': 'Hello, World!'}))
 return app
def main():
 app = create_app()
 app.run(debug=True)
 if __name__ == '__main__':
 main()