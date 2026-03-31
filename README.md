# PipTalk
## 1. Download requirements
To make sure that you can run this project on your machine, please run the following commands
```
pip install google-genai
pip install pymongo
pip install fastapi
pip install dotenv
pip install uvicorn
npm install
```
## 2. How to run the frontend to host
Open a terminal and run the following command (we use Vite for our project)
`npm run dev`
## 3. How to run the backend to host
Open another terminal and run the following command (we use uvicorn to run)
`uvicorn app:app --reload`
## 4. How to access the webpage after running both servers
The terminal that is running the frontend should have a local host link that looks something like this
```
Local:   http://localhost:5173/
```

Paste the link `http://localhost:5173/` into your browser of choice and enter to access the webpage entry point
## 5. How to use the chatbot
Answer queries as they appear on the screen. Loading can take a long time due to us being on free tier Gemini API, so please be patient.

## 6. Team Contributions
Latha: Gemini API, recommendation algo, and backend integration<br>
Ruina: MongoDB, data preprocessing, and frontend/backend integration<br>
Jiya: USC RSO webscraping, data preprocessing, and ElevenLabs integration (NLP)<br>
Jenny: Frontend integration, team management, and design

Happy club hunting!
