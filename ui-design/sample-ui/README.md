# MentorHub UI Design Sample

A complete HTML/CSS UI design sample for a mentorship platform with Jira-inspired styling. This project is responsive, adaptive, and ready to be converted into a React application.

## 📁 Project Structure

```
ui-design-sample/
├── styles.css              # Main stylesheet with design system
├── index.html              # Dashboard page
├── login.html              # Login page
├── register.html           # Registration page
├── mentors.html            # Mentor discovery/browse page
├── mentor-profile.html     # Individual mentor profile
├── bookings.html           # Bookings list page
├── booking-details.html    # Individual booking details
└── profile-edit.html       # Profile settings page
```

## 🎨 Design System

### Colors
- **Primary Blue**: #0052cc (main actions, links)
- **Secondary Blue**: #4c9aff (accents)
- **Success Green**: #00875a (confirmations, available slots)
- **Warning Yellow**: #ff991f (pending states)
- **Danger Red**: #de350b (errors, cancellations)
- **Neutral Grays**: 50-900 scale

### Typography
- Font Family: System fonts (-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto)
- Base Size: 14px
- Scale: xs(11px) → sm(12px) → base(14px) → md(16px) → lg(20px) → xl(24px) → xxl(29px)

### Spacing
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- xxl: 48px

## 📱 Pages Overview

### 1. **Dashboard** (`index.html`)
- Stats cards (sessions, bookings, hours)
- Upcoming sessions table
- Recent activity timeline
- Recommended mentors

### 2. **Authentication** (`login.html`, `register.html`)
- Clean centered forms
- Social login options
- Role selection (Mentee/Mentor)
- Form validation

### 3. **Mentor Discovery** (`mentors.html`)
- Filterable mentor grid
- Category, skill, rating, and price filters
- Mentor cards with key info
- Sorting options
- Pagination

### 4. **Mentor Profile** (`mentor-profile.html`)
- Detailed mentor information
- Skills & expertise display
- Availability calendar
- Reviews section
- Booking modal
- Stats sidebar

### 5. **Bookings** (`bookings.html`)
- Tab-based filtering (All, Upcoming, Pending, Completed, Cancelled)
- Booking cards with actions
- Status badges
- Quick actions

### 6. **Booking Details** (`booking-details.html`)
- Complete booking information
- Meeting link
- Payment details
- Session preparation checklist
- Cancellation policy
- Support options

### 7. **Profile Settings** (`profile-edit.html`)
- Basic information editing
- Mentor profile configuration
- Availability schedule management
- Security settings
- Account preferences

## 🎯 Key Features

### Responsive Design
- Mobile-first approach
- Breakpoints: 480px, 768px, 1024px
- Collapsible sidebar on mobile
- Adaptive grid layouts

### Components
- **Cards**: White containers with shadows
- **Buttons**: Primary, secondary, outline, danger variants
- **Badges**: Status indicators (success, warning, danger, neutral)
- **Forms**: Text inputs, textareas, selects with consistent styling
- **Tables**: Clean, hoverable rows
- **Modals**: Overlay with centered content
- **Calendar**: Visual availability display

### Database Models Covered

Based on your Prisma schema:
- ✅ **User**: Authentication and basic profile
- ✅ **MentorProfile**: Title, rate, bio, skills, categories
- ✅ **MenteeProfile**: Goals and learning preferences
- ✅ **Category**: Software Dev, Data Science, Design, etc.
- ✅ **Skill**: Specific technologies
- ✅ **Availability**: Weekly schedules for mentors
- ✅ **Booking**: Sessions with status (Pending, Confirmed, Completed, Cancelled)
- ✅ **Review**: Ratings and comments
- ✅ **FavoriteMentor**: Saved mentors

## 🚀 Getting Started

### View Locally
Simply open any HTML file in a web browser:
```bash
# Open dashboard
start index.html  # Windows
open index.html   # Mac
xdg-open index.html  # Linux
```

### For Development
Use a local server for better experience:
```bash
# Using Python
python -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Using VS Code
# Install "Live Server" extension and right-click → "Open with Live Server"
```

Then navigate to `http://localhost:8000`

## 🔄 Converting to React

This design is structured to be easily converted to React:

### Recommended Component Structure
```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   └── AppLayout.jsx
│   ├── common/
│   │   ├── Button.jsx
│   │   ├── Badge.jsx
│   │   ├── Card.jsx
│   │   └── Modal.jsx
│   ├── mentor/
│   │   ├── MentorCard.jsx
│   │   ├── MentorProfile.jsx
│   │   └── MentorFilters.jsx
│   └── booking/
│       ├── BookingCard.jsx
│       ├── BookingDetails.jsx
│       └── BookingModal.jsx
├── pages/
│   ├── Dashboard.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Mentors.jsx
│   ├── MentorProfile.jsx
│   ├── Bookings.jsx
│   └── ProfileEdit.jsx
└── styles/
    └── globals.css  # Import existing styles.css
```

### Migration Tips
1. **CSS Variables**: Already using CSS custom properties - perfect for React
2. **Component Classes**: Easy to convert to className props
3. **Forms**: Convert to controlled components with useState
4. **Navigation**: Use React Router for page navigation
5. **State Management**: Consider Redux/Zustand for global state
6. **API Integration**: Add axios/fetch calls to your backend

## 🎨 Customization

### Change Colors
Edit CSS variables in `styles.css`:
```css
:root {
  --primary-blue: #0052cc;  /* Change to your brand color */
  --success-green: #00875a;
  /* ... */
}
```

### Adjust Spacing
Modify spacing scale:
```css
:root {
  --space-md: 16px;  /* Adjust as needed */
}
```

### Typography
Change font family or sizes:
```css
:root {
  --font-family: 'Your Font', sans-serif;
  --font-size-base: 14px;
}
```

## 📦 Features Ready for Backend Integration

- User authentication (login/register)
- Mentor search and filtering
- Booking creation and management
- Profile editing
- Availability scheduling
- Review system
- Real-time updates (via WebSocket)
- File uploads (avatars)

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📄 License

This is a sample UI design for the MentorHub platform. Feel free to use and modify as needed.

## 🤝 Contributing

This is a design sample for conversion to React. When converting:
1. Maintain the design system consistency
2. Keep components reusable
3. Follow React best practices
4. Add TypeScript for type safety
5. Implement proper state management

---

**Ready to convert to React!** 🚀
