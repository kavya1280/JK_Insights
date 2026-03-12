# Create a virtual environment
python -m venv venv

# Activate it (Windows)
venv\Scripts\activate
# Activate it (Mac/Linux)
source venv/bin/activate

# Install the requirements
pip install -r requirements.txt

# Run the server
python app.py


#For the Frontend

cd frontend
npm install
npm run dev