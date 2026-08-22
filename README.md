Quickstart
1. Prerequisites
Ensure Python 3.10 or higher is installed on your machine.

2. Installation
Clone the repository and install the dependencies:

Bash
git clone https://github.com/your-username/realtime-system-metrics.git
cd realtime-system-metrics

pip install "fastapi[standard]" psutil
3. Run the Server
Launch the application using FastAPI's CLI:

Bash
fastapi dev main.py
4. View Dashboard
Open your browser and navigate to:

Plaintext
http://127.0.0.1:8000
📂 Project Structure
Plaintext
.
├── main.py          # FastAPI application, WebSocket logic, and embedded UI
├── README.md        # Project documentation
└── requirements.txt # Project dependencies
🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.
