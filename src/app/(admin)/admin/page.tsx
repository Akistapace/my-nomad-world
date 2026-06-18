import { listAllUsers } from "./actions";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const users = await listAllUsers();
  return <AdminClient users={users} />;
}
