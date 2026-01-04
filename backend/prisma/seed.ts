import { prisma } from "./client";


async function main() {
  console.log('Start seeding...');

  // Seed Categories
  const categories = [
    {
      name: 'Software Development',
      slug: 'software',
      description: 'Web development, mobile apps, software engineering'
    },
    {
      name: 'Data Science',
      slug: 'data',
      description: 'Data analysis, machine learning, AI'
    },
    {
      name: 'Design',
      slug: 'design',
      description: 'UI/UX design, graphic design, product design'
    },
    {
      name: 'Product Management',
      slug: 'product',
      description: 'Product strategy, roadmapping, user research'
    },
    {
      name: 'Business',
      slug: 'business',
      description: 'Business strategy, entrepreneurship, marketing'
    }
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category
    });
    console.log(`Created/Updated category: ${category.name}`);
  }

  // Seed some common skills
  const skills = [
    'React',
    'Python',
    'Java',
    'AWS',
    'Figma',
    'Machine Learning',
    'JavaScript',
    'TypeScript',
    'Node.js',
    'SQL',
    'Docker',
    'Kubernetes',
    'Product Strategy',
    'UX Research',
    'UI Design',
    'Marketing',
    'Leadership'
  ];

  for (const skillName of skills) {
    await prisma.skill.upsert({
      where: { name: skillName },
      update: {},
      create: { name: skillName }
    });
    console.log(`Created/Updated skill: ${skillName}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
