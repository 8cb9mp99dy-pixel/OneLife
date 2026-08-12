import type { TaskRow } from '../../../lib/db';
import TaskItem from './TaskItem';

export default function TaskList({ tasks }: { tasks: TaskRow[] }) {
  if (tasks.length === 0) {
    return <p className="py-8 text-center text-sm text-neutral-400 dark:text-neutral-500">No tasks.</p>;
  }

  return (
    <ul>
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </ul>
  );
}
