import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { Home, Users, Shield, ArrowLeft, Mail, Clock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { PageLoader } from "../components/ui/LoadingSpinner";
// Define local interfaces to avoid importing from outside src during build
// which causes resolution issues with some Vite/Rollup configs.
type Id<TableName extends string> = string & { __tableName: TableName };

interface Family {
    _id: string;
    name: string;
    emoji?: string;
}

interface UserData {
    _id: Id<"users">;
    name: string;
    email: string;
    isSuperAdmin?: boolean;
}

export function AdminDashboardPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = React.useState<"overview" | "users">("overview");

    // Fetch stats (will error if not admin, handled by boundary or simple check)
    // We cast to unknown then to our local Shape because we cannot import the real return type easily without importing Id
    // But since we have a structural Id, let's see if we can just plain use it or cast cleanly.
    // The issue is that we are defining the type of `stats` manually to use our Local Id.
    const stats = useQuery(api.admin.getStats, user ? { userId: user._id as Id<"users"> } : "skip") as {
        totalFamilies: number;
        totalUsers: number;
        totalInvites: number;
        pendingInvites: number;
        recentFamilies: Family[];
    } | undefined;

    // Wait until user is loaded
    if (!user) return <PageLoader />;

    // Note: We don't have isSuperAdmin on the frontend user type yet in AuthContext, 
    // but if the query fails/returns error (or returns undefined while loading), we handle it.

    if (!stats && activeTab === "overview") {
        return <PageLoader />;
    }

    return (
        <div className="min-h-screen bg-base-200 p-4 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate("/")} className="btn btn-circle btn-ghost">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="w-6 h-6 text-primary" />
                        Panel SuperAdmin
                    </h1>
                    <p className="text-sm opacity-60">Visión global del sistema Kovan</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs tabs-boxed mb-6">
                <a
                    className={`tab ${activeTab === "overview" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("overview")}
                >
                    Resumen
                </a>
                <a
                    className={`tab ${activeTab === "users" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("users")}
                >
                    Usuarios
                </a>
            </div>

            {activeTab === "overview" && stats && (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <StatCard
                            icon={<Home className="w-5 h-5 text-blue-500" />}
                            label="Familias"
                            value={stats.totalFamilies}
                        />
                        <StatCard
                            icon={<Users className="w-5 h-5 text-green-500" />}
                            label="Usuarios"
                            value={stats.totalUsers}
                        />
                        <StatCard
                            icon={<Mail className="w-5 h-5 text-purple-500" />}
                            label="Invitaciones"
                            value={stats.totalInvites}
                        />
                        <StatCard
                            icon={<Clock className="w-5 h-5 text-orange-500" />}
                            label="Pendientes"
                            value={stats.pendingInvites}
                        />
                    </div>

                    {/* Recent Families */}
                    <div className="card bg-base-100 shadow-xl mb-6">
                        <div className="card-body">
                            <h2 className="card-title text-lg mb-4">Familias Recientes</h2>
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Nombre</th>
                                            <th>Emoji</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.recentFamilies.map((f: Family) => (
                                            <tr key={f._id}>
                                                <td className="font-mono text-xs opacity-50">{f._id}</td>
                                                <td className="font-bold">{f.name}</td>
                                                <td className="text-xl">{f.emoji}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeTab === "users" && <UsersManager userId={user._id} />}

        </div>
    );
}

function UsersManager({ userId }: { userId: Id<"users"> }) {
    return <UsersList userId={userId} />;
}

function UsersList({ userId }: { userId: Id<"users"> }) {
    const users = useQuery(api.admin.getUsers, { userId }) as UserData[] | undefined;
    const deleteUser = useMutation(api.admin.deleteUser);

    if (!users) return <PageLoader />;

    const handleDelete = async (targetId: Id<"users">, name: string) => {
        if (confirm(`¿Estás seguro de eliminar al usuario ${name}? Esta acción no se puede deshacer.`)) {
            await deleteUser({ userId, targetUserId: targetId });
        }
    };

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title text-lg mb-4">Gestión de Usuarios</h2>
                <div className="overflow-x-auto">
                    <table className="table text-sm">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Admin</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u: UserData) => (
                                <tr key={u._id}>
                                    <td className="font-bold">{u.name}</td>
                                    <td className="opacity-70">{u.email}</td>
                                    <td>
                                        {u.isSuperAdmin ? (
                                            <span className="badge badge-primary badge-xs">SUPER</span>
                                        ) : (
                                            <span className="badge badge-ghost badge-xs">USER</span>
                                        )}
                                    </td>
                                    <td>
                                        {!u.isSuperAdmin && (
                                            <button
                                                onClick={() => handleDelete(u._id, u.name)}
                                                className="btn btn-ghost btn-xs text-error"
                                            >
                                                Eliminar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) {
    return (
        <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4 flex flex-col items-center justify-center text-center">
                <div className="mb-2 p-2 bg-base-200 rounded-full">{icon}</div>
                <div className="text-2xl font-black">{value}</div>
                <div className="text-xs opacity-60 uppercase font-bold tracking-wider">{label}</div>
            </div>
        </div>
    );
}
