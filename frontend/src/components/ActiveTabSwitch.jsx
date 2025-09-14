import { useChatStore } from "../store/useChatStore";

function ActiveTabSwitch() {
  const { activeTab, setActiveTab } = useChatStore();

  return (
    <div className="tabs tabs-boxed bg-transparent p-2 mx-3 sm:mx-2">
      <button
        onClick={() => setActiveTab("chats")}
        className={`tab flex-1 text-sm sm:text-base py-2 px-4 rounded-lg transition-all ${
          activeTab === "chats"
            ? "bg-cyan-500/20 text-cyan-400 font-medium"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/30"
        }`}
        aria-label="Switch to chats"
      >
        Chats
      </button>

      <button
        onClick={() => setActiveTab("contacts")}
        className={`tab flex-1 text-sm sm:text-base py-2 px-4 rounded-lg transition-all ${
          activeTab === "contacts"
            ? "bg-cyan-500/20 text-cyan-400 font-medium"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/30"
        }`}
        aria-label="Switch to contacts"
      >
        Contacts
      </button>
    </div>
  );
}
export default ActiveTabSwitch;
