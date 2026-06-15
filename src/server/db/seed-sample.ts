/**
 * Optional sample data for local development / demos. Idempotent: skips if the
 * SITE project already exists. Run via `pnpm db:seed:sample`. Not used in prod.
 */
import { projectService, moduleService, milestoneService, taskService, attachmentService } from '../services';

async function main() {
  try {
    await projectService.getByKey('SITE');
    console.info('• sample data already present, skipping');
    return;
  } catch {
    // not found → seed below
  }

  const project = await projectService.create({
    key: 'SITE',
    name: 'Landing site',
    emoji: '🚀',
    color: '#3FB984',
    status: 'active',
    pinned: true,
    tags: ['Next.js', 'Tailwind'],
    shortDesc: 'Marketing site + build-log for the launch.',
    statusNote: 'Hero + pricing left before we can ship v1.',
  });
  const pid = project.id;

  const core = (
    await moduleService.create({
      projectId: pid,
      name: 'Core UI',
      color: '#4C8DFF',
      icon: 'board',
      state: 'active',
      description: 'Hero, layout shell, and the design-token system.',
    })
  ).id;
  const content = (
    await moduleService.create({
      projectId: pid,
      name: 'Content',
      color: '#34BE9A',
      icon: 'folder',
      state: 'planned',
      description: 'Copy, docs, and marketing pages.',
    })
  ).id;

  const p1 = (
    await milestoneService.create({
      projectId: pid,
      name: 'Phase 1 · Foundations',
      status: 'done',
      targetDate: new Date('2026-06-01'),
    })
  ).id;
  const p2 = (
    await milestoneService.create({
      projectId: pid,
      name: 'Phase 2 · Launch',
      status: 'active',
      targetDate: new Date('2026-07-15'),
    })
  ).id;

  const T = (t: Parameters<typeof taskService.create>[0]) => taskService.create({ projectId: pid, ...(t as object) });

  await T({ title: 'Wire up the hero section', status: 'done', priority: 'high', moduleId: core, milestoneId: p1 });
  await T({ title: 'Pick the type scale + tokens', status: 'done', priority: 'medium', moduleId: core, milestoneId: p1 });
  const bento = await T({ title: 'Build the bento feature grid', status: 'in_progress', priority: 'high', moduleId: core, milestoneId: p2 });
  // a few sub-tasks (checklist children of the bento task)
  await taskService.addSubtask(bento.id, 'Sketch the bento layout');
  const cell = await taskService.addSubtask(bento.id, 'Build the responsive grid cells');
  await taskService.addSubtask(bento.id, 'Add hover + reveal interactions');
  await taskService.toggleDone(cell.id);
  const pricing = await T({
    title: 'Ship the pricing page',
    status: 'pending',
    priority: 'urgent',
    moduleId: core,
    milestoneId: p2,
    statusNote: 'Waiting on final pricing tiers from the spreadsheet.',
  });
  // sample attachments (metadata only — byte storage is deferred)
  await attachmentService.add({ taskId: pricing.id, name: 'pricing-tiers.csv', type: 'file', size: '3.4 KB', ext: 'csv' });
  await attachmentService.add({ taskId: pricing.id, name: 'pricing-mock.png', type: 'image', size: '218 KB', ext: 'png' });
  await T({
    title: 'Review the hero animation timing',
    status: 'in_review',
    priority: 'medium',
    moduleId: core,
    milestoneId: p2,
  });
  await T({ title: 'Write the launch build-log post', status: 'todo', priority: 'low', moduleId: content, milestoneId: p2 });
  await T({ title: 'Draft the FAQ copy', status: 'backlog', priority: 'none', moduleId: content });
  await T({ title: 'Decide on an analytics tool', status: 'todo', priority: 'low' });

  // a couple of inbox ideas
  await taskService.create({ title: 'Add a dark-mode toggle to the navbar' });
  await taskService.create({ title: 'Tweet the launch thread the morning of' });

  console.info('✓ seeded sample project SITE with modules, milestones, tasks');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('✗ sample seed failed:', err);
    process.exit(1);
  });
