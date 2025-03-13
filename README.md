# OnboardX - Employee Onboarding Management System

OnboardX is a comprehensive employee onboarding management system designed to streamline the process of integrating new employees into organizations. The application provides role-based access control and customizable onboarding workflows.

## Features

### Authentication & Authorization
- Role-based access control (IT Admin, Department Admin, Employee)
- Secure login and registration system
- Department code verification for registration
- JWT-based authentication

### IT Admin Features
- Create and manage department codes
- Monitor onboarding processes across departments
- Configure system-wide settings
- User management capabilities

### Department Admin Features
- Create customized onboarding templates
- Track employee onboarding progress
- Manage department-specific settings
- Generate onboarding reports

### Employee Features
- Complete assigned onboarding tasks
- Upload required documents
- Track onboarding progress
- Access orientation materials

## Technical Architecture

### Backend
- Node.js + Express.js REST API
- MongoDB database with Mongoose ODM
- JWT authentication
- Input validation using express-validator
- Environment-based configuration

### API Endpoints

#### Authentication
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login

#### Department Codes
- POST `/api/department-codes` - Create department code
- GET `/api/department-codes` - List department codes

#### Onboarding Templates
- POST `/api/onboarding-templates` - Create template
- GET `/api/onboarding-templates` - List templates
- GET `/api/onboarding-templates/:id` - Get template details
- PUT `/api/onboarding-templates/:id` - Update template
- DELETE `/api/onboarding-templates/:id` - Delete template

## Application Flow

1. **Initial Setup**
   - IT Admin registers using a special department code
   - IT Admin creates department codes for different departments

2. **Department Setup**
   - Department Admins register using department codes
   - Department Admins create onboarding templates
   - Templates include tasks, document requirements, and notifications

3. **Employee Onboarding**
   - New employees register using department codes
   - Assigned onboarding template is activated
   - Employees complete tasks and upload documents
   - Admins track progress and manage completion

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation
1. Clone the repository
```bash
git clone https://github.com/SamarpanThapa/Onboard.git
```

2. Install dependencies
```bash
cd OnboardX
npm install
```

3. Create .env file with required environment variables
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5001
```

4. Start the development server
```bash
npm run dev
```

## Environment Variables

- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `PORT`: Server port (default: 5001)

## Security Features

- Password hashing using bcrypt
- JWT token-based authentication
- Input validation and sanitization
- Protected API endpoints
- Environment variable configuration

## Future Enhancements

- Email notifications system
- Document template management
- Advanced reporting features
- Integration with HR systems
- Mobile application support

## Project Structure

```
onboardx/
├── public/           # Static files
│   ├── css/         # Stylesheets
│   ├── js/          # Client-side JavaScript
│   └── images/      # Image assets
├── src/             # Server-side code
│   ├── config/      # Configuration files
│   ├── controllers/ # Route controllers
│   ├── middleware/  # Custom middleware
│   ├── models/      # Database models
│   ├── routes/      # Route definitions
│   └── utils/       # Utility functions
├── views/           # HTML templates
└── server.js        # Application entry point
```

## Scripts

- `npm start`: Start the production server
- `npm run dev`: Start the development server with nodemon
- `npm test`: Run tests (to be implemented)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License. 
