from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import re
from sklearn import preprocessing
from sklearn.tree import DecisionTreeClassifier, _tree
from sklearn.model_selection import train_test_split
import csv
import os
from difflib import get_close_matches
import itertools
import nltk
from rapidfuzz import process, fuzz
from dotenv import load_dotenv
import google.generativeai as genai
nltk.download('punkt')

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Get the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# Load environment variables from .env
load_dotenv(os.path.join(current_dir, '.env'))
GEMINI_API_KEY = "AIzaSyBmA0mcQbizFMV2seZL5imflx_HDwwfwiw"

print("Loaded GEMINI_API_KEY:", GEMINI_API_KEY)

genai.configure(api_key=GEMINI_API_KEY)

# Load and process dataset (1).csv for training
def load_custom_dataset(csv_path):
    # Read all rows
    rows = []
    all_symptoms = set()
    with open(csv_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.reader(csvfile)
        for row in reader:
            if not row or not row[0].strip():
                continue
            disease = row[0].strip()
            symptoms = [s.strip().replace(' ', '_').lower() for s in row[1:] if s.strip()]
            all_symptoms.update(symptoms)
            rows.append((disease, symptoms))
    all_symptoms = sorted(list(all_symptoms))
    # Build DataFrame
    data = []
    for disease, symptoms in rows:
        row_dict = {sym: 1 if sym in symptoms else 0 for sym in all_symptoms}
        row_dict['prognosis'] = disease
        data.append(row_dict)
    df = pd.DataFrame(data)
    return df, all_symptoms

# Use dataset (1).csv for training
custom_csv_path = os.path.join(current_dir, 'Files', 'dataset (1).csv')
df, all_symptoms = load_custom_dataset(custom_csv_path)

cols = all_symptoms + ['prognosis']
x = df[all_symptoms]
y = df['prognosis']

le = preprocessing.LabelEncoder()
le.fit(y)
y_encoded = le.transform(y)

x_train, x_test, y_train, y_test = train_test_split(x, y_encoded, test_size=0.33, random_state=42)
clf = DecisionTreeClassifier().fit(x_train, y_train)

# Dictionaries to store severity, description, and precaution data
severityDictionary = dict()
description_list = dict()
precautionDictionary = dict()
symptoms_dict = {}

# Populating the symptoms dictionary with symptom indices
for index, symptom in enumerate(x):
    symptoms_dict[symptom] = index

# Load symptom description data from CSV
def getDescription():
    global description_list
    with open(os.path.join(current_dir, 'Files', 'symptom_Description.csv')) as csv_file:
        csv_reader = csv.reader(csv_file, delimiter=',')
        for row in csv_reader:
            _description = {row[0]: row[1]}
            description_list.update(_description)

# Load symptom severity data from CSV
def getSeverityDict():
    global severityDictionary
    with open(os.path.join(current_dir, 'Files', 'Symptom_severity.csv')) as csv_file:
        csv_reader = csv.reader(csv_file, delimiter=',')
        try:
            for row in csv_reader:
                _diction = {row[0]: int(row[1])}
                severityDictionary.update(_diction)
        except:
            pass

# Load symptom precautions data from CSV
def getprecautionDict():
    global precautionDictionary
    with open(os.path.join(current_dir, 'Files', 'symptom_precaution.csv')) as csv_file:
        csv_reader = csv.reader(csv_file, delimiter=',')
        for row in csv_reader:
            _prec = {row[0]: [row[1], row[2], row[3], row[4]]}
            precautionDictionary.update(_prec)

# Function to check for a pattern match in symptoms
def check_pattern(dis_list, inp):
    pred_list = []
    inp = inp.replace(' ', '_')
    patt = f"{inp}"
    regexp = re.compile(patt)
    pred_list = [item for item in dis_list if regexp.search(item)]
    if len(pred_list) > 0:
        return 1, pred_list
    else:
        return 0, []

# Function for secondary prediction
def sec_predict(symptoms_exp):
    df = pd.read_csv(os.path.join(current_dir, 'Files', 'Training.csv'))
    X = df.iloc[:, :-1]
    y = df['prognosis']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=20)

    rf_clf = DecisionTreeClassifier()
    rf_clf.fit(X_train, y_train)

    symptoms_dict = {symptom: index for index, symptom in enumerate(X)}
    input_vector = np.zeros(len(symptoms_dict))

    for item in symptoms_exp:
        input_vector[[symptoms_dict[item]]] = 1

    return rf_clf.predict([input_vector])

# Function to print the disease prediction
def print_disease(node):
    node = node[0]
    val = node.nonzero()
    disease = le.inverse_transform(val[0])
    return list(map(lambda x: x.strip(), list(disease)))

# Calculate the severity of conditions based on symptoms
def calc_condition(exp, days):
    sum = 0
    for item in exp:
        sum += severityDictionary[item]
    if (sum * days) / (len(exp) + 1) > 13:
        return "You should consult a doctor."
    else:
        return "It may not be severe, but you should take precautions."

# Load the data for severity, description, and precautions
getSeverityDict()
getDescription()
getprecautionDict()

# Get all available symptoms
@app.route('/api/symptoms', methods=['GET'])
def get_symptoms():
    all_symptoms = list(all_symptoms)
    return jsonify({"symptoms": all_symptoms})

# Load all diseases and their symptoms from dataset (1).csv
custom_csv_path = os.path.join(current_dir, 'Files', 'dataset (1).csv')
disease_symptom_map = {}
all_diseases = set()
all_symptoms_set = set()
with open(custom_csv_path, newline='', encoding='utf-8') as csvfile:
    reader = csv.reader(csvfile)
    for row in reader:
        if not row or not row[0].strip():
            continue
        disease = row[0].strip().lower()
        symptoms = [s.strip().replace(' ', '_').lower() for s in row[1:] if s.strip()]
        disease_symptom_map[disease] = symptoms
        all_diseases.add(disease)
        all_symptoms_set.update(symptoms)

# Symptom checking flow states and questions
SYMPTOM_FLOW = {
    'headache': {
        'location': {
            'question': 'Where is the pain located?',
            'options': ['Forehead', 'Temples', 'Back of head', 'Whole head', 'One side', 'Other']
        },
        'intensity': {
            'question': 'How would you describe the pain?',
            'options': ['Mild', 'Moderate', 'Severe', 'Throbbing', 'Sharp', 'Other']
        },
        'duration': {
            'question': 'How long have you been experiencing this?',
            'options': ['Less than 1 hour', '1-4 hours', '4-24 hours', 'More than 24 hours', 'Other']
        },
        'triggers': {
            'question': 'What makes it worse?',
            'options': ['Movement', 'Light', 'Noise', 'Stress', 'Nothing specific', 'Other']
        }
    },
    'fever': {
        'temperature': {
            'question': 'What is your temperature?',
            'options': ['Below 100°F', '100-101°F', '101-102°F', 'Above 102°F', 'Not sure', 'Other']
        },
        'duration': {
            'question': 'How long have you had the fever?',
            'options': ['Less than 24 hours', '1-3 days', 'More than 3 days', 'Other']
        },
        'symptoms': {
            'question': 'What other symptoms do you have with the fever?',
            'options': ['Chills', 'Sweating', 'Body aches', 'Fatigue', 'None', 'Other']
        }
    },
    'cough': {
        'type': {
            'question': 'What type of cough do you have?',
            'options': ['Dry', 'Wet/Phlegm', 'Barking', 'Wheezing', 'Other']
        },
        'duration': {
            'question': 'How long have you been coughing?',
            'options': ['Less than 1 week', '1-2 weeks', 'More than 2 weeks', 'Other']
        },
        'triggers': {
            'question': 'What triggers or worsens your cough?',
            'options': ['Cold air', 'Lying down', 'Exercise', 'Nothing specific', 'Other']
        }
    },
    'stomach_pain': {
        'location': {
            'question': 'Where is the pain located?',
            'options': ['Upper abdomen', 'Lower abdomen', 'Left side', 'Right side', 'Whole abdomen', 'Other']
        },
        'type': {
            'question': 'What type of pain is it?',
            'options': ['Cramping', 'Sharp', 'Dull', 'Burning', 'Other']
        },
        'duration': {
            'question': 'How long have you had the pain?',
            'options': ['Less than 1 hour', '1-6 hours', '6-24 hours', 'More than 24 hours', 'Other']
        }
    }
}

# Store conversation states
conversation_states = {}

def get_next_question(user_id, current_symptom, current_state=None):
    if not current_state:
        return list(SYMPTOM_FLOW[current_symptom].keys())[0]
    
    flow_states = list(SYMPTOM_FLOW[current_symptom].keys())
    current_index = flow_states.index(current_state)
    
    if current_index < len(flow_states) - 1:
        return flow_states[current_index + 1]
    return None

def detect_symptom(message):
    message = message.lower()
    symptoms = {
        'headache': ['headache', 'head pain', 'head ache', 'migraine'],
        'fever': ['fever', 'temperature', 'hot', 'feverish'],
        'cough': ['cough', 'coughing', 'hacking'],
        'stomach_pain': ['stomach pain', 'abdominal pain', 'belly pain', 'stomachache']
    }
    
    for symptom, keywords in symptoms.items():
        if any(keyword in message for keyword in keywords):
            return symptom
    return None

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '').strip()
        user_id = data.get('user_id', 'default_user')
        previous_messages = data.get('previous_messages', []) if data.get('previous_messages') else []
        
        if not user_message:
            return jsonify({'text': "Please enter a message."})

        # Initialize or get conversation state
        if user_id not in conversation_states:
            conversation_states[user_id] = {
                'symptom': None,
                'state': None,
                'responses': {}
            }

        state = conversation_states[user_id]['state']
        current_symptom = conversation_states[user_id]['symptom']
        
        # If this is a symptom-related message and we're not in a flow
        if not state:
            detected_symptom = detect_symptom(user_message)
            if detected_symptom:
                conversation_states[user_id]['symptom'] = detected_symptom
                conversation_states[user_id]['state'] = list(SYMPTOM_FLOW[detected_symptom].keys())[0]
                return jsonify({
                    'text': SYMPTOM_FLOW[detected_symptom][conversation_states[user_id]['state']]['question'],
                    'options': SYMPTOM_FLOW[detected_symptom][conversation_states[user_id]['state']]['options'],
                    'type': 'symptom_check',
                    'symptom': detected_symptom
                })
        
        # If we're in a symptom checking flow
        if state and current_symptom:
            # Store the user's response
            conversation_states[user_id]['responses'][state] = user_message
            
            # Get next question
            next_state = get_next_question(user_id, current_symptom, state)
            
            if next_state:
                conversation_states[user_id]['state'] = next_state
                return jsonify({
                    'text': SYMPTOM_FLOW[current_symptom][next_state]['question'],
                    'options': SYMPTOM_FLOW[current_symptom][next_state]['options'],
                    'type': 'symptom_check',
                    'symptom': current_symptom
                })
            else:
                # We've completed the symptom check
                responses = conversation_states[user_id]['responses']
                symptom = current_symptom
                conversation_states[user_id] = {'symptom': None, 'state': None, 'responses': {}}
                
                # Generate a response based on collected information
                prompt = f"""Based on the following {symptom.replace('_', ' ')} symptoms:
                {chr(10).join([f"{k}: {v}" for k, v in responses.items()])}
                
                Provide a brief, friendly response with:
                1. A brief assessment
                2. Suggested over-the-counter medications (if appropriate)
                3. When to see a doctor
                Keep the response concise and supportive."""
                
                model = genai.GenerativeModel("gemini-2.0-flash")
                response = model.generate_content(prompt)
                return jsonify({
                    'text': response.text,
                    'type': 'final_response',
                    'symptom': symptom
                })

        # Default chat behavior for non-symptom messages
        prompt = (
            "You are Y&R Pharma's friendly AI health assistant. "
            "If the user describes symptoms, analyze them and suggest possible over-the-counter medicines or next steps. "
            "Only suggest medicines that are available on the Y&R Pharma website. "
            "If the user mentions a disease, provide a brief, friendly explanation and offer to share symptoms, medicines, or precautions. "
            "If the input is unclear, politely ask for more details. Always be supportive, never give a diagnosis, and recommend seeing a doctor for serious issues. "
            "Keep your answers short, clear, and friendly.\n\n"
        )
        
        full_prompt = prompt + user_message
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(full_prompt)
        return jsonify({
            'text': response.text,
            'type': 'chat'
        })

    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return jsonify({'text': "I apologize, but I encountered an error while processing your request. Please try again later."}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
