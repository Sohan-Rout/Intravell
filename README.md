# Intravel - Local Guide Platform

Intravel is a platform that connects tourists with local guides, making travel experiences more authentic and personalized.

## Project Structure

The project consists of three main parts:

1. **Backend** - Node.js/Express server handling API requests and database operations
2. **Citizen App** - React Native app for local guides to manage their profiles and tours
3. **Tourist App** - React Native app for tourists to find guides and plan their trips

## Features

### For Tourists
- Personalized travel itineraries
- Local guide search and booking
- Real-time chat with guides
- Voice call support
- Currency conversion
- Emergency contacts
- Travel tips and insights

### For Local Guides
- Profile management
- Tour request handling
- Portfolio management
- Availability settings
- Certification management
- Earnings tracking

## Tech Stack

- **Frontend**: React Native, Expo
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT
- **Voice Calls**: Twillio & Vapi
- **AI Integration**: OpenAI API

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Expo CLI
- Android Studio / Xcode (for mobile development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Sparsh-06/Intravel.git
cd Intravel
```

2. Install dependencies for each part:
```bash
# Backend
cd backend
npm install

# Citizen App
cd ../citizen
npm install

# Tourist App
cd ../tourist
npm install
```

3. Set up environment variables:
Create `.env` files in each directory with the required environment variables.

4. Start the development servers:
```bash
# Backend
cd backend
npm run dev

# Citizen App
cd ../citizen
npm start

# Tourist App
cd ../tourist
npm start
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Sparsh - [@Sparsh-06](https://github.com/Sparsh-06)

Project Link: [https://github.com/Sparsh-06/Intravel](https://github.com/Sparsh-06/Intravel) 
