import re

with open('frontend/src/app/page.tsx', 'r') as f:
    content = f.read()

# 1. Add activeItems and completedItems
injection = """
  const activeItems = items.filter(i => !i.is_resolved);
  const completedItems = items.filter(i => i.is_resolved);
"""
content = content.replace("  const getButtonState = (currentStatus: string,", injection + "\n  const getButtonState = (currentStatus: string,")

# 2. Replace all instances of items.length and items.filter with activeItems... in the rendering section
# We only want to do this in the Priority Queue UI.
target_ui = """                    <button
                      onClick={() => setActiveTab('All')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all flex items-center gap-1.5 ${
                        activeTab === 'All'
                          ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                          : 'bg-zinc-900/50 border-zinc-800/50 text-zinc-500 hover:text-blue-400/80 hover:bg-blue-500/10 hover:border-blue-500/30'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'All' ? 'bg-blue-400' : 'bg-blue-500/50'}`}></div>
                      All ({items.length})
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('Action Required')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all flex items-center gap-1.5 ${
                        activeTab === 'Action Required'
                          ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                          : 'bg-zinc-900/50 border-zinc-800/50 text-zinc-500 hover:text-red-400/80 hover:bg-red-500/10 hover:border-red-500/30'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'Action Required' ? 'bg-red-400' : 'bg-red-500/50'}`}></div>
                      Action Required ({items.filter(i => i.priority_tag === 'Action Required').length})
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('FYI')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all flex items-center gap-1.5 ${
                        activeTab === 'FYI'
                          ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                          : 'bg-zinc-900/50 border-zinc-800/50 text-zinc-500 hover:text-yellow-400/80 hover:bg-yellow-500/10 hover:border-yellow-500/30'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'FYI' ? 'bg-yellow-400' : 'bg-yellow-500/50'}`}></div>
                      FYI ({items.filter(i => i.priority_tag === 'FYI').length})
                    </button>

                    <button
                      onClick={() => setActiveTab('Ignore')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all flex items-center gap-1.5 ${
                        activeTab === 'Ignore'
                          ? 'bg-zinc-700/50 border-zinc-500 text-zinc-300 shadow-[0_0_10px_rgba(161,161,170,0.2)]'
                          : 'bg-zinc-900/50 border-zinc-800/50 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 hover:border-zinc-700'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'Ignore' ? 'bg-zinc-400' : 'bg-zinc-600'}`}></div>
                      Ignore ({items.filter(i => i.priority_tag === 'Can Ignore' || i.priority_tag === 'Uncategorized').length})
                    </button>"""

new_ui = target_ui.replace("items.length", "activeItems.length").replace("items.filter", "activeItems.filter")
content = content.replace(target_ui, new_ui)

content = content.replace("const filteredItems = items.filter(item => {", "const filteredItems = activeItems.filter(item => {")

completed_section = """
          {completedItems.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4 px-1 opacity-70">
                <CheckCircle2 size={18} className="text-green-500" />
                <h2 className="text-lg font-semibold text-zinc-300 tracking-tight">Completed Today</h2>
                <span className="text-xs font-medium bg-zinc-800 px-2 py-0.5 rounded-full ml-2 text-zinc-400">
                  {completedItems.length}
                </span>
              </div>
              <div className="space-y-4">
                {completedItems.map(item => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
"""

content = content.replace("            </div>\n          )}\n\n        </div>", "            </div>\n          )}\n" + completed_section + "\n        </div>")

with open('frontend/src/app/page.tsx', 'w') as f:
    f.write(content)

print("Done")
