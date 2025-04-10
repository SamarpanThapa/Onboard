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

## Recent Updates and Fixes

We've made significant improvements to the application's functionality and resolved several critical issues:

### Document Viewer and Management
- **Fixed Document Viewer Modal**: Resolved issues with the document viewer modal that was previously broken
- **Enhanced Document Download**: Implemented robust document downloading with fallback methods
- **PDF Generation**: Added ability to generate document previews for different document types
- **Multi-tier Error Handling**: Implemented comprehensive error handling for document operations
- **"Mark as Verified" Functionality**: Added ability for admins to mark documents as verified
- **Improved Close Button Functionality**: Fixed modal closing mechanisms

![Document Viewer](https://i.imgur.com/PLACEHOLDER1.png)

### Task Management System
- **Fixed Task Assignment**: Resolved issues with the "Assign Task" button functionality
- **Enhanced Task Creation Flow**: Improved the task creation modal and form validation
- **Task Status Management**: Fixed task status updates (To Do, In Progress, Completed)
- **Task Filtering**: Added ability to filter tasks by status and priority
- **Robust Error Handling**: Added fallback mechanisms for task creation and updates
- **Improved UI/UX**: Enhanced the task card display and interaction patterns

![Task Management](https://i.imgur.com/PLACEHOLDER2.png)

### Template Management System
- **Fixed Template Creation**: Resolved issues with the "New Template" button
- **Multi-tier API Integration**: Implemented database saving with multiple fallback methods
- **Category Organization**: Organized templates into logical categories (Onboarding, HR, Legal)
- **Template Preview**: Added visual preview for different document types
- **Download Functionality**: Implemented template downloading with proper file types
- **Enhanced Form Validation**: Added comprehensive validation for template creation
- **Loading States**: Improved loading indicators and user feedback

![Template Management](https://i.imgur.com/PLACEHOLDER3.png)

### General Improvements
- **Pure CSS Implementation**: Reduced Bootstrap dependencies for better performance
- **Centralized Alert System**: Implemented a unified notification system
- **Local Storage Fallbacks**: Added localStorage fallbacks when API endpoints fail
- **Code Reorganization**: Better organization of JavaScript modules
- **Improved Error Messages**: More descriptive error messages for better user experience
- **Responsive Design Fixes**: Enhanced mobile responsiveness throughout the application

### Technical Enhancements
- **Asynchronous API Handling**: Improved promise-based API interactions
- **Event Delegation**: Better event handling and bubbling management
- **Form Data Processing**: Enhanced file upload and form submission
- **DOM Manipulation Optimization**: More efficient DOM updates and rendering
- **Lazy Loading**: Implemented lazy loading for better performance
- **Cross-browser Compatibility**: Fixed issues with different browsers

## Technical Architecture

### Backend
- Node.js + Express.js REST API
- MongoDB database with Mongoose ODM
- JWT authentication
- Input validation using express-validator
- Environment-based configuration

### Frontend
- Pure HTML, CSS, and JavaScript
- Modular JavaScript architecture
- Progressive enhancement strategy
- Responsive design with CSS flexbox and grid
- Custom form validation and handling

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

#### Document Management
- POST `/api/documents` - Upload document
- GET `/api/documents/:id` - Get document
- PUT `/api/documents/:id/verify` - Mark document as verified
- DELETE `/api/documents/:id` - Delete document

#### Task Management
- POST `/api/tasks` - Create task
- GET `/api/tasks` - List tasks
- PUT `/api/tasks/:id/status` - Update task status
- DELETE `/api/tasks/:id` - Delete task

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
│   │   ├── admin.js # Admin dashboard functionality
│   │   ├── document-fix.js # Document handling fixes
│   │   └── simplified-tasks.js # Task management
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

## Key JavaScript Files and Their Functions

### document-fix.js
- Provides fixes for document viewing and downloading
- Implements a pure CSS modal system for document display
- Handles document verification functionality
- Provides fallbacks for API errors

### admin.js
- Core dashboard functionality
- Employee management features
- Onboarding progress tracking
- System configuration options

### simplified-tasks.js
- Task creation and assignment
- Task status management
- Task filtering and organization
- Assignment notifications

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

## Troubleshooting

### Common Issues and Solutions

1. **Document Viewer Not Working**: If the document viewer is not displaying correctly, check if the `document-fix.js` file is properly loaded. The file includes multiple fallback methods to ensure documents can be viewed in various formats.

2. **Task Assignment Issues**: If the Assign Task button doesn't work, the application includes a direct fix in `document-fix.js` that implements multiple methods to detect and fix the button functionality.

3. **Template Creation Problems**: The template creation functionality includes several fallback methods. If you're having issues, try refreshing the page and ensuring you have the proper permissions.

4. **API Connection Failures**: The application includes local storage fallbacks for many features. If API connections fail, data will be stored locally where possible.

5. **Modal Closing Issues**: If modals don't close properly, try using the ESC key or clicking outside the modal area. The application implements multiple methods to close modals.

## Basic Application Flow (Visual Guide)

The following diagram illustrates the basic flow of the OnboardX application:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Registration   │────>│ Department      │────>│  Onboarding     │
│  & Login        │     │ Setup           │     │  Process        │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  HR Approval    │<────│ Document        │<────│  Task           │
│  & Completion   │     │ Verification    │     │  Completion     │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

1. **Registration & Login**: Users register with appropriate role and department code, then log in
2. **Department Setup**: Department admins configure templates and onboarding processes
3. **Onboarding Process**: Employees are assigned templates and begin the onboarding process
4. **Task Completion**: Employees complete assigned tasks and update their status
5. **Document Verification**: Admins verify uploaded documents and mark them as verified
6. **HR Approval & Completion**: HR approves the completed onboarding process

## Screenshots to Include

Here are the key screenshots that should be included in this README to showcase the application's functionality:

### 1. Login Screen
*Take a screenshot of the login interface showing:*
- Username and password fields
- Login button
- Remember me option
- Forgot password link
- Clean, professional design

### 2. Registration Process
*Take a screenshot of the registration form showing:*
- User information fields
- Department code entry
- Role selection
- Password requirements
- Submit button and form validation

### 3. Dashboard Overview
*Take a screenshot of the main dashboard showing:*
- Key metrics and statistics
- Navigation sidebar
- Status cards showing onboarding progress
- Recent activity feed

### 4. Employee Onboarding Process
*Take a screenshot of the employee onboarding progress view showing:*
- Progress timeline with completed and pending steps
- Document submission status indicators
- Task completion metrics
- Status badges (In Progress, Completed, etc.)

### 5. Document Management Interface
*Take a screenshot of the document viewer modal showing:*
- Document preview (for a sample document like "Proof of Citizenship")
- Verification controls
- Download and close buttons
- Document information panel

### 6. Task Assignment System
*Take a screenshot of the task management interface showing:*
- Task cards organized by status (To Do, In Progress, Completed)
- Task creation modal
- Priority indicators
- Assignee information
- Due dates and deadlines

### 7. Template Management
*Take a screenshot of the template management page showing:*
- Template categories (Onboarding, HR, Legal)
- Template cards with different document types
- New Template button and modal
- Template search/filter functionality

### 8. Mobile Responsiveness
*Take a screenshot showing the application on a mobile device:*
- Responsive navigation
- Mobile-optimized task view
- Touch-friendly controls
- Adaptive layout for smaller screens

### 9. Multi-Role Views
*Take side-by-side screenshots showing different views for:*
- IT Admin perspective
- Department Admin perspective
- Employee perspective

These screenshots will provide a comprehensive visual overview of the OnboardX system and help users understand its key features and interfaces.

## This is the pre-alpha version
Many of the features might be missing or not working!! Please be patient as I am working on it. Updates will be made on a regular basis.

