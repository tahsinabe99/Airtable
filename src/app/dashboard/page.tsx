"use client";

import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import Link from "next/link";
import { Menu, HelpCircle, Search, ChevronRight, Plus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: bases = [], isLoading } = api.base.getAll.useQuery();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const utils = api.useUtils();

  const createBase = api.base.create.useMutation({
    onSuccess: () => {
      utils.base.getAll.invalidate();
    },
  });

  const handleCreateBase = () => {
    const defaultName = "Untitled Base";
    createBase.mutate({ name: defaultName });
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top Nav */}
      <div className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 h-12 border-b border-[#e3e6ea] bg-white shadow-sm z-20">
        <div className="flex items-center gap-4">
          <Menu
            className="w-5 h-5 cursor-pointer"
            onClick={() => setSidebarOpen((prev) => !prev)}
          />
          <Image
            src="/airtable-logo.svg"
            alt="Airtable"
            width={120}
            height={32}
          />
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-1.5 rounded-full border border-gray-200 text-sm w-80 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <Search className="w-4 h-4 absolute left-3 top-2 text-gray-400" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <HelpCircle className="w-5 h-5 text-gray-500 cursor-pointer" />
          {session?.user?.image && (
            <Image
              src={session.user.image}
              alt="User Avatar"
              width={32}
              height={32}
              className="rounded-full"
            />
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden pt-12">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-60 bg-white border-r border-[#e3e6ea] p-4 flex flex-col justify-between">
            <div>
              <nav className="space-y-6 text-sm">
                <div className="flex justify-between items-center cursor-pointer hover:bg-gray-100 rounded px-2 py-1">
                  <p className="font-medium">Home</p>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex justify-between items-center cursor-pointer hover:bg-gray-100 rounded px-2 py-1">
                  <p className="font-medium">All workspaces</p>
                  <div className="flex items-center gap-1">
                    <Plus className="w-4 h-4 text-gray-500" />
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
              </nav>
            </div>

            <div className="text-sm text-gray-600 space-y-3">
              <p className="cursor-pointer hover:underline">Templates and apps</p>
              <p className="cursor-pointer hover:underline">Marketplace</p>
              <p className="cursor-pointer hover:underline">Import</p>
              <button
                onClick={handleCreateBase}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl shadow hover:bg-blue-700"
              >
                + Create
              </button>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 overflow-y-auto">
          <section className="p-6">
            {isLoading ? (
              <p>Loading bases...</p>
            ) : bases.length === 0 ? (
              <p className="text-gray-600">No bases created yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {bases.map((base) => (
                  <Link
                    key={base.id}
                    href={`/base/${base.id}`}
                    className="bg-white rounded-xl p-4 shadow hover:shadow-md transition border border-gray-200"
                  >
                    <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center font-bold rounded-md mb-2">
                      Un
                    </div>
                    <h2 className="font-semibold text-gray-800">{base.name}</h2>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
