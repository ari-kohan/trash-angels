# Trash Angels

A mobile app that helps communities clean up trash by allowing users to mark trash locations on a map and notify nearby users.

## Features

- **Interactive Map**: View and interact with a map showing trash locations that need to be picked up
- **Add Trash Locations**: Mark locations where trash needs to be picked up
- **Notifications**: Receive notifications about trash within a 0.5-mile radius
- **Mark as Picked Up**: Mark trash as picked up once it's been cleaned
- **User Profile**: View your cleanup history and manage settings

## Tech Stack

- React Native with Expo
- TypeScript
- Supabase for backend storage
- React Native Maps for map functionality
- Expo Location for location tracking
- Expo Notifications for push notifications

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI
- Supabase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/trash-angels.git
cd trash-angels
```

2. Install dependencies
```bash
npm install
```

3. Set up Supabase
   - Create a new Supabase project
   - Create a `trash_locations` table with the following schema:
     - id (uuid, primary key)
     - latitude (float, not null)
     - longitude (float, not null)
     - created_at (timestamp with time zone, not null)
     - created_by (uuid, not null)
     - status (text, not null) - can be 'active' or 'picked_up'
     - description (text)
     - image_url (text)

4. Update Supabase configuration
   - Open `lib/supabase.ts`
   - Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with your actual Supabase URL and anon key

5. Start the development server
```bash
npm start
```

## Usage

1. **View Map**: The main screen shows a map with trash locations marked as pins
2. **Add Trash**: Tap the "+" button and then tap on the map to mark a trash location
3. **Mark as Picked Up**: Tap on a trash pin and select "Mark as Picked Up" when you've cleaned it
4. **Profile**: Tap the profile icon to view your cleanup history and manage settings

## Project Structure

- `/app` - Main application screens
- `/components` - Reusable UI components
- `/context` - React context for state management
- `/lib` - Utility functions and external service configurations
- `/types` - TypeScript type definitions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
