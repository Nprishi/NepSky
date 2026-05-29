import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Search, Send, Users, UserCheck } from "lucide-react";

import { supabase } from "../lib/supabase";
import { useAdmin } from "../contexts/AdminContext";
import AdminKeyGate from "./AdminKeyGate";

type RecipientMode = "all" | "specific" | "selected";

interface UserType {
  id: string;
  full_name: string;
  email: string;
}

const NotificationsManagement: React.FC = () => {
  const { admin } = useAdmin();

  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<RecipientMode>("all");

  const [specificUser, setSpecificUser] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  const [filter, setFilter] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [about, setAbout] = useState("");
  const [type, setType] = useState("info");

  const [scheduledAt, setScheduledAt] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email")
      .order("full_name", { ascending: true });

    if (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Could not load users",
      });

      return;
    }

    setUsers(data || []);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const clearForm = () => {
    setTitle("");
    setDescription("");
    setAbout("");
    setType("info");
    setSpecificUser("");
    setSelectedIds({});
    setScheduledAt("");
  };

  const handleSend = async () => {
    if (!title.trim()) {
      return Swal.fire({
        icon: "warning",
        title: "Title Required",
        text: "Please enter notification title",
      });
    }

    if (!description.trim()) {
      return Swal.fire({
        icon: "warning",
        title: "Description Required",
        text: "Please enter notification description",
      });
    }

    setLoading(true);

    try {
      let targets: string[] = [];

      // ALL USERS
      if (mode === "all") {
        const { data, error } = await supabase.from("users").select("id");

        if (error) throw error;

        targets = (data || []).map((u) => u.id);
      }

      // SPECIFIC USER
      else if (mode === "specific") {
        if (!specificUser) {
          setLoading(false);

          return Swal.fire({
            icon: "warning",
            title: "Select User",
            text: "Please select a user",
          });
        }

        targets = [specificUser];
      }

      // SELECTED USERS
      else {
        targets = Object.entries(selectedIds)
          .filter(([, value]) => value)
          .map(([key]) => key);

        if (targets.length === 0) {
          setLoading(false);

          return Swal.fire({
            icon: "warning",
            title: "No Users Selected",
            text: "Please select at least one user",
          });
        }
      }

      const rows = targets.map((userId) => ({
        user_id: userId,
        title: title.trim(),
        body: description.trim(),
        type,
        about: about || null,
        scheduled_at: scheduledAt
          ? new Date(scheduledAt).toISOString()
          : new Date().toISOString(),
        sent_by: admin?.id || null,
        is_read: false,
      }));

      const { error } = await supabase.from("notifications").insert(rows);

      if (error) {
        console.error(error);

        return Swal.fire({
          icon: "error",
          title: "Failed",
          text: error.message,
        });
      }

      Swal.fire({
        icon: "success",
        title: "Success",
        text: `Notification sent to ${rows.length} users`,
      });

      clearForm();
    } catch (err: any) {
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    `${u.full_name} ${u.email}`.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <AdminKeyGate>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-md p-6">
          {/* HEADER */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Notification Management</h2>

              <p className="text-sm text-gray-500 mt-1">
                Send notifications to users
              </p>
            </div>

            <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
              Admin Panel
            </div>
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT */}
            <div className="lg:col-span-2 space-y-4">
              {/* TITLE */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Notification Title
                </label>

                <input
                  type="text"
                  placeholder="Enter notification title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Description
                </label>

                <textarea
                  placeholder="Enter notification message..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 min-h-[140px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* ABOUT */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  About (Optional)
                </label>

                <input
                  type="text"
                  placeholder="About notification"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* TYPE */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Notification Type
                </label>

                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </div>

            {/* RIGHT */}
            <div className="space-y-5">
              {/* RECIPIENTS */}
              <div>
                <label className="block text-sm font-semibold mb-3">
                  Recipients
                </label>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={mode === "all"}
                      onChange={() => setMode("all")}
                    />
                    <Users className="w-4 h-4" />
                    All Users
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={mode === "specific"}
                      onChange={() => setMode("specific")}
                    />
                    <UserCheck className="w-4 h-4" />
                    Specific User
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={mode === "selected"}
                      onChange={() => setMode("selected")}
                    />
                    <Users className="w-4 h-4" />
                    Selected Users
                  </label>
                </div>
              </div>

              {/* SPECIFIC USER */}
              {mode === "specific" && (
                <div>
                  <select
                    value={specificUser}
                    onChange={(e) => setSpecificUser(e.target.value)}
                    className="w-full border rounded-xl px-4 py-3"
                  >
                    <option value="">Select User</option>

                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* SELECTED USERS */}
              {mode === "selected" && (
                <div>
                  {/* SEARCH */}
                  <div className="flex items-center gap-2 border rounded-xl px-3 py-2 mb-3">
                    <Search className="w-4 h-4 text-gray-400" />

                    <input
                      type="text"
                      placeholder="Search users..."
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="w-full outline-none"
                    />
                  </div>

                  {/* USERS */}
                  <div className="border rounded-xl max-h-64 overflow-y-auto">
                    {filteredUsers.map((u) => (
                      <label
                        key={u.id}
                        className="flex items-center justify-between px-3 py-2 border-b hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!selectedIds[u.id]}
                            onChange={() => toggleSelect(u.id)}
                          />

                          <div>
                            <div className="text-sm font-medium">
                              {u.full_name}
                            </div>

                            <div className="text-xs text-gray-500">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* SCHEDULE */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Schedule Time (Optional)
                </label>

                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3"
                />
              </div>

              {/* BUTTONS */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSend}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition"
                >
                  <Send className="w-4 h-4" />

                  {loading ? "Sending..." : "Send"}
                </button>

                <button
                  onClick={clearForm}
                  className="bg-gray-200 hover:bg-gray-300 rounded-xl px-4 py-3 transition"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminKeyGate>
  );
};

export default NotificationsManagement;
