import { v4 as uuidv4 } from 'uuid';
import { db } from './drizzle';
import { users, members, messages, events, eventRsvps, posts, postLikes, postComments } from './schema';

// Mock profile pictures (placeholder URLs)
const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Casey',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Morgan',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Riley',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Avery',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Quinn',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sage',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=River',
];

// Mock users data
const MOCK_USERS = [
  { username: 'alexchen', displayName: 'Alex Chen', bio: 'Full-stack developer passionate about building communities' },
  { username: 'jordanlee', displayName: 'Jordan Lee', bio: 'UX designer | Coffee enthusiast | Dog person' },
  { username: 'taylorsmith', displayName: 'Taylor Smith', bio: 'Product manager by day, musician by night' },
  { username: 'caseykim', displayName: 'Casey Kim', bio: 'Startup founder | Always learning something new' },
  { username: 'morganwilson', displayName: 'Morgan Wilson', bio: 'Data scientist exploring the intersection of AI and creativity' },
  { username: 'rileybrown', displayName: 'Riley Brown', bio: 'Community builder | Event organizer | Connector of people' },
  { username: 'averygarcia', displayName: 'Avery Garcia', bio: 'Marketing strategist with a love for storytelling' },
  { username: 'quinnmartinez', displayName: 'Quinn Martinez', bio: 'Software engineer | Open source contributor' },
  { username: 'sageanderson', displayName: 'Sage Anderson', bio: 'Content creator | Podcaster | Lifelong learner' },
  { username: 'riverjohnson', displayName: 'River Johnson', bio: 'Designer and illustrator based in NYC' },
];

// Mock chat messages
const MOCK_MESSAGES = [
  "Hey everyone! Excited to be part of this community 👋",
  "Just discovered this place, looks amazing!",
  "Anyone going to the meetup next week?",
  "Great discussion today, learned a lot!",
  "Thanks for the warm welcome!",
  "Love the energy here. Let's build something great together!",
  "Quick question: has anyone tried the new feature?",
  "Happy Monday, team! Let's make it a productive week 💪",
  "Just wrapped up a project. Time to celebrate! 🎉",
  "Who's up for a virtual coffee chat?",
  "Sharing my latest work in the feed - would love feedback!",
  "This community keeps getting better and better",
  "Don't forget to RSVP for Thursday's event!",
  "Anyone else working on something cool this weekend?",
  "Just joined and already feeling inspired by everyone here",
];

// Mock events data
const MOCK_EVENTS = [
  {
    title: 'Community Kickoff Meetup',
    description: 'Join us for our monthly community gathering! We\'ll discuss upcoming initiatives, share wins, and connect with fellow members. Light refreshments will be provided.',
    location: 'The Hub Coworking Space, 123 Main St',
    startTime: '18:00',
    endTime: '20:00',
    daysFromNow: 7,
  },
  {
    title: 'Workshop: Building Your Personal Brand',
    description: 'Learn the fundamentals of personal branding in the digital age. We\'ll cover social media strategy, content creation, and authentic storytelling.',
    location: 'Online - Zoom',
    startTime: '14:00',
    endTime: '16:00',
    daysFromNow: 14,
  },
  {
    title: 'Networking Happy Hour',
    description: 'Casual drinks and conversation with community members. A great opportunity to meet new people and expand your network in a relaxed setting.',
    location: 'Rooftop Bar, 456 Oak Ave',
    startTime: '17:30',
    endTime: '20:00',
    daysFromNow: 21,
  },
  {
    title: 'Tech Talk: AI in 2026',
    description: 'Exploring the latest developments in artificial intelligence and what they mean for our industry. Featuring Q&A with leading practitioners.',
    location: 'Innovation Center Auditorium',
    startTime: '19:00',
    endTime: '21:00',
    daysFromNow: 28,
  },
  {
    title: 'Creative Workshop: Design Thinking',
    description: 'Hands-on workshop introducing design thinking methodology. Learn to solve problems creatively and build user-centered solutions.',
    location: 'Maker Space, 789 Creative Blvd',
    startTime: '10:00',
    endTime: '13:00',
    daysFromNow: 35,
  },
  {
    title: 'Community Potluck & Game Night',
    description: 'Bring your favorite dish and join us for an evening of food, board games, and good company. Family friendly!',
    location: 'Community Center, 321 Park Lane',
    startTime: '16:00',
    endTime: '21:00',
    daysFromNow: 42,
  },
];

// Mock posts data
const MOCK_POSTS = [
  {
    content: "Just finished reading an incredible book on community building. Key takeaway: authenticity always wins. What's everyone reading these days? 📚",
    daysAgo: 0,
  },
  {
    content: "Thrilled to announce I've joined this amazing community! Looking forward to connecting with all of you and learning from your experiences. Let's grow together! 🚀",
    daysAgo: 1,
  },
  {
    content: "Pro tip: Take breaks! Just came back from a walk and my productivity doubled. Sometimes stepping away is the best thing you can do for your work. 🌳",
    daysAgo: 1,
  },
  {
    content: "Had an amazing conversation at yesterday's meetup. The insights shared were invaluable. This is why communities matter - we're stronger together! 💪",
    daysAgo: 2,
  },
  {
    content: "Working on something exciting that I can't wait to share with everyone. Sneak peek coming soon! Stay tuned... 👀",
    daysAgo: 3,
  },
  {
    content: "Question for the group: What's your favorite productivity tool? I'm always looking for ways to optimize my workflow. Drop your recommendations below! ⚡",
    daysAgo: 4,
  },
  {
    content: "Grateful for this community. In the past month alone, I've made genuine connections, learned new skills, and found collaborators for my project. Thank you all! 🙏",
    daysAgo: 5,
  },
  {
    content: "Hot take: The best networking happens organically. Stop collecting contacts and start building relationships. Quality > quantity every time. 🤝",
    daysAgo: 6,
  },
  {
    content: "Just shipped a new feature at work! Couldn't have done it without the support and advice from members here. You know who you are - thank you! 🎉",
    daysAgo: 7,
  },
  {
    content: "Reminder: It's okay to not have everything figured out. We're all works in progress, and that's perfectly fine. Keep learning, keep growing! 🌱",
    daysAgo: 8,
  },
];

// Mock comments
const MOCK_COMMENTS = [
  "Love this! Totally agree 💯",
  "Great perspective, thanks for sharing!",
  "This resonates so much with me",
  "Couldn't have said it better myself",
  "Thanks for the inspiration!",
  "Yes! This is exactly what I needed to hear today",
  "Interesting take, I'd love to discuss more",
  "You nailed it! 🎯",
  "Adding this to my notes",
  "Big facts! Thanks for posting this",
];

// Helper function to get a date relative to today
function getRelativeDate(daysFromNow: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Helper function to get a past date
function getPastDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(12, 0, 0, 0);
  return date;
}

// Helper to pick random items from an array
function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function seed() {
  console.log('🌱 Starting seed...\n');

  try {
    // Create users
    console.log('👤 Creating users...');
    const createdUsers: { id: string; username: string; displayName: string }[] = [];
    
    for (let i = 0; i < MOCK_USERS.length; i++) {
      const user = MOCK_USERS[i];
      const userId = uuidv4();
      
      await db.insert(users).values({
        id: userId,
        username: user.username,
        displayName: user.displayName,
        pfpUrl: AVATARS[i],
        phone: `+1555000${(1000 + i).toString().slice(1)}`,
        role: i === 0 ? 'admin' : i < 3 ? 'organizer' : 'user',
        status: 'active',
        createdAt: getPastDate(30 - i * 2),
        updatedAt: getPastDate(Math.max(0, 10 - i)),
      }).onConflictDoNothing();
      
      createdUsers.push({ id: userId, username: user.username, displayName: user.displayName });
      console.log(`  ✓ Created user: ${user.displayName}`);
    }

    // Create members
    console.log('\n👥 Creating members...');
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      const bio = MOCK_USERS[i].bio;
      
      await db.insert(members).values({
        id: uuidv4(),
        userId: user.id,
        bio,
        createdAt: getPastDate(28 - i * 2),
      }).onConflictDoNothing();
      
      console.log(`  ✓ ${user.displayName} joined as member`);
    }

    // Create messages
    console.log('\n💬 Creating messages...');
    for (let i = 0; i < MOCK_MESSAGES.length; i++) {
      const user = createdUsers[i % createdUsers.length];
      
      await db.insert(messages).values({
        id: uuidv4(),
        userId: user.id,
        content: MOCK_MESSAGES[i],
        createdAt: getPastDate(Math.floor(i / 2)),
      });
      
      console.log(`  ✓ Message from ${user.displayName}`);
    }

    // Create events
    console.log('\n📅 Creating events...');
    const createdEvents: { id: string; title: string }[] = [];
    
    for (const eventData of MOCK_EVENTS) {
      const creator = createdUsers[Math.floor(Math.random() * 3)]; // First 3 users are admins/organizers
      const eventId = uuidv4();
      
      await db.insert(events).values({
        id: eventId,
        creatorId: creator.id,
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        eventDate: getRelativeDate(eventData.daysFromNow),
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        isExternal: false,
        createdAt: getPastDate(14),
        updatedAt: getPastDate(7),
      });
      
      createdEvents.push({ id: eventId, title: eventData.title });
      console.log(`  ✓ Created event: ${eventData.title}`);
    }

    // Create RSVPs for events
    console.log('\n🎟️ Creating event RSVPs...');
    for (const event of createdEvents) {
      const rsvpUsers = pickRandom(createdUsers, 3 + Math.floor(Math.random() * 5));
      
      for (const user of rsvpUsers) {
        await db.insert(eventRsvps).values({
          id: uuidv4(),
          eventId: event.id,
          userId: user.id,
          status: Math.random() > 0.2 ? 'going' : 'interested',
          createdAt: getPastDate(Math.floor(Math.random() * 7)),
        }).onConflictDoNothing();
      }
      
      console.log(`  ✓ ${rsvpUsers.length} RSVPs for: ${event.title}`);
    }

    // Create posts
    console.log('\n📝 Creating posts...');
    const createdPosts: { id: string; userId: string }[] = [];
    
    for (let i = 0; i < MOCK_POSTS.length; i++) {
      const postData = MOCK_POSTS[i];
      const user = createdUsers[i % createdUsers.length];
      const postId = uuidv4();
      
      await db.insert(posts).values({
        id: postId,
        userId: user.id,
        content: postData.content,
        createdAt: getPastDate(postData.daysAgo),
        updatedAt: getPastDate(postData.daysAgo),
      });
      
      createdPosts.push({ id: postId, userId: user.id });
      console.log(`  ✓ Post by ${user.displayName}`);
    }

    // Create likes for posts
    console.log('\n❤️ Creating post likes...');
    for (const post of createdPosts) {
      const likeUsers = pickRandom(
        createdUsers.filter(u => u.id !== post.userId),
        2 + Math.floor(Math.random() * 6)
      );
      
      for (const user of likeUsers) {
        await db.insert(postLikes).values({
          id: uuidv4(),
          postId: post.id,
          userId: user.id,
          createdAt: getPastDate(Math.floor(Math.random() * 5)),
        }).onConflictDoNothing();
      }
      
      console.log(`  ✓ ${likeUsers.length} likes on a post`);
    }

    // Create comments for posts
    console.log('\n💬 Creating post comments...');
    for (const post of createdPosts) {
      const commentCount = Math.floor(Math.random() * 4);
      const commentUsers = pickRandom(
        createdUsers.filter(u => u.id !== post.userId),
        commentCount
      );
      
      for (const user of commentUsers) {
        const comment = MOCK_COMMENTS[Math.floor(Math.random() * MOCK_COMMENTS.length)];
        
        await db.insert(postComments).values({
          id: uuidv4(),
          postId: post.id,
          userId: user.id,
          content: comment,
          createdAt: getPastDate(Math.floor(Math.random() * 3)),
        });
      }
      
      if (commentCount > 0) {
        console.log(`  ✓ ${commentCount} comments on a post`);
      }
    }

    console.log('\n✅ Seed completed successfully!\n');
    console.log('Summary:');
    console.log(`  • ${createdUsers.length} users created`);
    console.log(`  • ${createdUsers.length} members created`);
    console.log(`  • ${MOCK_MESSAGES.length} messages created`);
    console.log(`  • ${createdEvents.length} events created`);
    console.log(`  • ${createdPosts.length} posts created`);
    console.log(`  • Multiple likes and comments added`);
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run seed
seed().then(() => {
  console.log('\n🎉 Done! Your community is now populated with mock data.\n');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
