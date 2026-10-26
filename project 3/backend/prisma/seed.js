import { prisma } from '../src/config/database.js';
import { hashPassword } from '../src/auth/auth.service.js';
const passwordHash = await hashPassword('DemoPass123!');
try {
  const profiles = [['Alex Lee', 'alex'], ['Mara Kim', 'mara'], ['Theo Oliver', 'theo'], ['Sofia Chen', 'sofia']];
  const users = [];
  for (const [name, handle] of profiles) users.push(await prisma.user.upsert({ where: { handle }, update: {}, create: { name, handle, email: `${handle}@commonroom.demo`, passwordHash } }));
  const roomInputs = [['the-common-room', 'Small wins, big ideas, and the everyday in between.'], ['design-studio', 'A space for inspiration, feedback, and making things better.'], ['build-together', 'For the things we’re making, and the people making them.'], ['little-wins', 'Nothing is too small to celebrate.'], ['off-the-clock', 'Good books, weekend plans, and life beyond the screen.']];
  const rooms = [];
  for (const [name, description] of roomInputs) { const room = await prisma.room.upsert({ where: { name }, update: {}, create: { name, description } }); rooms.push(room); for (const user of users) await prisma.membership.upsert({ where: { userId_roomId: { userId: user.id, roomId: room.id } }, update: {}, create: { userId: user.id, roomId: room.id } }); }
  const conversation = [[1, 'Morning, lovely people! ☀️\nNew week, fresh coffee, and a few ideas I’m excited to share. How’s everyone doing?'], [2, 'Coffee is brewing. Ideas are loading. Feeling like a good day already. ☕'], [3, 'Just wrapped up the first pass on the welcome screens. Sharing a little peek in #design-studio later today!'], [0, 'Love this energy. Small steps, good company. Let’s make something we’re proud of. ✨'], [1, '@alex that’s the spirit. Also, a tiny reminder: you don’t have to have it all figured out to start.'], [2, 'Adding that to the wall above my desk. 🙌']];
  for (const room of rooms.slice(0, 2)) for (const [index, [authorIndex, content]] of conversation.entries()) {
    const clientMessageId = `30000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
    await prisma.message.upsert({ where: { roomId_authorId_clientMessageId: { roomId: room.id, authorId: users[authorIndex].id, clientMessageId } }, update: {}, create: { roomId: room.id, authorId: users[authorIndex].id, clientMessageId, content, createdAt: new Date(Date.now() - (60 - index * 7) * 60000) } });
  }
  console.log('Demo workspace ready. alex@commonroom.demo or mara@commonroom.demo / DemoPass123!');
} finally { await prisma.$disconnect(); }
