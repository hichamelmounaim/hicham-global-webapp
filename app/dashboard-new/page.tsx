import React from 'react';

export default function KitchenDashboard() {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      <div className="bg-background font-body text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      {/* SideNavBar Shell */}
      <aside className="fixed left-0 top-0 h-screen flex flex-col py-8 w-64 bg-[#ffe3d2] dark:bg-orange-950/20 z-50">
        <div className="px-6 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-lg">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>skillet</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#9c3f00] dark:text-orange-500 tracking-tight font-headline">Alchemist</h1>
              <p className="text-xs font-label text-on-surface-variant/70 uppercase tracking-widest">Digital Kitchen</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-2 pr-4">
          {/* Active: Dashboard */}
          <a className="flex items-center gap-4 py-3 px-6 text-[#9c3f00] dark:text-orange-400 font-bold bg-[#ffffff] dark:bg-orange-900/30 rounded-r-full transition-all duration-200 scale-95 origin-left" href="#">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
            <span className="font-['Plus_Jakarta_Sans'] font-medium text-sm">Dashboard</span>
          </a>
          <a className="flex items-center gap-4 py-3 px-6 text-[#7f512e] dark:text-orange-200/60 hover:text-[#9c3f00] hover:bg-[#ffede4] dark:hover:bg-orange-900/10 transition-colors" href="#">
            <span className="material-symbols-outlined">menu_book</span>
            <span className="font-['Plus_Jakarta_Sans'] font-medium text-sm">My Recipes</span>
          </a>
          <a className="flex items-center gap-4 py-3 px-6 text-[#7f512e] dark:text-orange-200/60 hover:text-[#9c3f00] hover:bg-[#ffede4] dark:hover:bg-orange-900/10 transition-colors" href="#">
            <span className="material-symbols-outlined">auto_awesome_motion</span>
            <span className="font-['Plus_Jakarta_Sans'] font-medium text-sm">Templates</span>
          </a>
          <a className="flex items-center gap-4 py-3 px-6 text-[#7f512e] dark:text-orange-200/60 hover:text-[#9c3f00] hover:bg-[#ffede4] dark:hover:bg-orange-900/10 transition-colors" href="#">
            <span className="material-symbols-outlined">settings</span>
            <span className="font-['Plus_Jakarta_Sans'] font-medium text-sm">Settings</span>
          </a>
        </nav>
        <div className="px-6 mt-auto">
          <div className="bg-surface-container-low p-4 rounded-2xl">
            <p className="text-xs font-label text-on-surface-variant mb-2">Chef's Tip</p>
            <p className="text-xs text-on-surface leading-relaxed italic">"Try adding 'smoked paprika' to your next roasted vegetable prompt."</p>
          </div>
        </div>
      </aside>

      {/* TopAppBar Shell */}
      <header className="fixed top-0 right-0 left-64 flex justify-between items-center px-8 h-20 z-40 bg-[#fff4ef]/80 dark:bg-stone-950/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-on-surface-variant font-medium text-sm">Welcome back, Chef Julian</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <span className="text-[#7f512e] font-['Plus_Jakarta_Sans'] font-semibold text-sm">12 Credits Remaining</span>
            <button className="bg-white border border-outline-variant/30 text-primary px-5 py-1.5 rounded-full text-sm font-bold hover:bg-surface-container transition-colors">Upgrade</button>
          </div>
          <div className="h-6 w-[1px] bg-outline-variant/20"></div>
          <div className="flex items-center gap-4">
            <button className="text-[#7f512e] hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border-2 border-primary-container/20">
              <img alt="User Chef Profile" className="w-full h-full object-cover" data-alt="Close up portrait of a professional chef" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlk3O7X8E7f3Chkcb8HMmphT2pdXES7hQt2zVBF5O7gaUN47OSy3rfErn172du7cSAr4HvS57P-TWDXDK_caWEH5vtnqJTJuHnStefT1k9zItrWjbPSvelBwA_X17urHSqBQgOckbTMbVfEv3K4yt7zzr-ZGZ1BEyidLnFAtPSw50PFGru5rOfAJMM5fXa-KyKV-hanqwm33EQIEsrFld2MHuKtJvEDbygUn3PbN8LedVbwcnHy_H4osittV-CId5el-9_r8qzfO4" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="pl-64 pt-20 min-h-screen">
        <div className="max-w-7xl mx-auto p-12 space-y-16">
          {/* Hero Generator Section */}
          <section className="relative">
            <div className="absolute -top-24 -right-12 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl -z-10"></div>
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-secondary-container/10 rounded-full blur-3xl -z-10"></div>
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-8">
              <h2 className="text-5xl lg:text-7xl font-headline font-extrabold tracking-tighter text-on-surface leading-none">
                What shall we <br/>
                <span className="text-primary italic">create</span> today?
              </h2>
              <p className="text-xl text-on-surface-variant font-body">Input your cravings or leftover ingredients, and let the Alchemist weave a masterpiece.</p>
              <div className="w-full mt-4">
                <div className="relative group">
                  <input className="w-full h-20 px-8 rounded-full bg-surface-container-low border-none focus:ring-0 focus:bg-surface-container-lowest text-xl font-body placeholder:text-on-surface-variant/40 transition-all duration-300 shadow-sm hover:shadow-md outline-none" placeholder="e.g., A zesty lemon chicken with garden herbs..." type="text" />
                  <button className="absolute right-2 top-2 h-16 px-10 bg-gradient-to-br from-[#9c3f00] to-[#ff7a2f] shadow-[0_8px_24px_rgba(156,63,0,0.2)] text-white rounded-full font-headline font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    Generate New Recipe
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Bento Grid - Recent Recipes */}
          <section className="space-y-8">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-primary font-bold tracking-widest text-xs uppercase font-label">The Archive</span>
                <h3 className="text-3xl font-headline font-bold text-on-surface">Recent Creations</h3>
              </div>
              <a className="text-on-surface-variant font-semibold hover:text-primary transition-colors flex items-center gap-1 group" href="#">
                View All My Recipes 
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {/* Recipe Card 1 */}
              <div className="md:col-span-2 md:row-span-2 group relative overflow-hidden rounded-[2rem] bg-surface-container-lowest">
                <div className="h-[450px] overflow-hidden">
                  <img alt="Gourmet Mushroom Risotto" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRf3JqHNBaWuTQH7ZgOaMQ2_7IQjeaGFXdze3y2BWJkb3mdGjVomPujnBuFre6Qvo71-jJn1Jpf06M5kbTPLILEoZYO9Cex3FaWzzHmo8xqiBcvBuXqHs1g1I7u8z-0QTE5Q3kZR56oTORO34KYvvufKDkNLmG0AMPkDTnvnnAh8ebVwL7KNuExqpdM0JpuamUKx1uwvJ2N8KuzflqClgafsohG19dWcIJV8ftLa8XZkwSUlW-uXoGCdIFrHJDAJXFcKDKvbjZtuc" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 p-10 space-y-3 w-full">
                  <div className="flex gap-2">
                    <span className="bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-on-surface-variant uppercase tracking-wider">Dinner</span>
                    <span className="bg-secondary-container px-4 py-1.5 rounded-full text-xs font-bold text-on-secondary-container uppercase tracking-wider">Vegan</span>
                  </div>
                  <h4 className="text-3xl font-headline font-bold text-white">Gourmet Wild Mushroom &amp; Truffle Risotto</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70 text-sm font-body">Created Oct 24, 2023</span>
                    <div className="flex items-center gap-2 text-white font-medium">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      <span>35 mins</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipe Card 2 */}
              <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden group">
                <div className="h-48 overflow-hidden relative">
                  <img alt="Superfood Bowl" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhl6N12Uh1Rx6Wd9_2Q_r7PjThZimUpJIIlNWb-s_n8hXm4K_nZuI6ScpqKUtAhi1KlqBM0azRH7Kt1iBhFc9pOmtzrkRk1l35W0mZpTrqCjRyYu1-2l-v-tXQPk5li8xPW1mD1w6jQK-QCl6ExZDHJhQBQFtVZM7VgPPMsysKoOAJtL1PEhH6bOnx7FHZC0gUZRHL0Hnr4jB15KlasrMqNTaEANzo1Tc2Y9tMdreDrKJHz4Xm0j14Qv5NFcMn_LeGIOiRgID6vcU" />
                  <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold">LUNCH</div>
                </div>
                <div className="p-6 space-y-4">
                  <h4 className="text-lg font-headline font-bold text-on-surface group-hover:text-primary transition-colors leading-snug">Avocado &amp; Quinoa Power Bowl</h4>
                  <p className="text-xs text-on-surface-variant font-medium">Oct 22, 2023</p>
                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">High Protein</span>
                  </div>
                </div>
              </div>

              {/* Recipe Card 3 */}
              <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden group">
                <div className="h-48 overflow-hidden relative">
                  <img alt="Glazed Donuts" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuApsbFIpBDtSS5YBByzD42x30Y5h6ervorccc9BR0-H5KdZh7OXqhHtL0uo7JDcszNJiY-n-u8TS890STn7-DtU3mmkJNRWjMuEMKnS1sj2ftx_2DBq_rb-pKS_oww6klOYmfhcxSrWyrCaAoUN18hAiUh9G0C8AlTqHQzfedrxKO3oivXPMUYF7qxHy6AJvlfpTWDkRWEk-mUd4_1kX42WvSZMsE-8wCAAIVWvX_gAURwQtm1pB5PlZ6HsFkFQ5YjT7SL_IqYPrKo" />
                  <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold">DESSERT</div>
                </div>
                <div className="p-6 space-y-4">
                  <h4 className="text-lg font-headline font-bold text-on-surface group-hover:text-primary transition-colors leading-snug">Sourdough Honey-Glazed Donuts</h4>
                  <p className="text-xs text-on-surface-variant font-medium">Oct 20, 2023</p>
                  <div className="flex items-center gap-3 pt-2">
                    <span className="material-symbols-outlined text-sm text-tertiary">star</span>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">Chef's Choice</span>
                  </div>
                </div>
              </div>

              {/* Recipe Card 4 */}
              <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden group">
                <div className="h-48 overflow-hidden relative">
                  <img alt="Caprese Salad" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIE21_eekKi7ZTNg7uvD7bW9ITAzJvjZPQaHjrjAAZyE7dD6922X2VlD1sYcazjin8Z20gbMqp40CcYoyeTtyrqq45SlTwNFYmGRW5pSnndcqbUuovenE0sQhQHhg_qeca_g3zLfD8nMWEq9jYMQgmDuI4_Zmk2wlmRyzz3o77UPGYPDLRkv5tl5ASYMOoo3vrtrGfrEoIrI4iKzU-B2N1kV9dYiuY1uWALUefnZ1Z4O1SUO5la83a2_ygnpXfKSLSApZe7E3qJ00" />
                  <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold">STARTER</div>
                </div>
                <div className="p-6 space-y-4">
                  <h4 className="text-lg font-headline font-bold text-on-surface group-hover:text-primary transition-colors leading-snug">Heirloom Tomato &amp; Burrata Mosaic</h4>
                  <p className="text-xs text-on-surface-variant font-medium">Oct 19, 2023</p>
                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">15 Min Prep</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Stats / CTA Section */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
            <div className="bg-surface-container-low p-8 rounded-[2rem] flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-3xl">restaurant_menu</span>
              </div>
              <div>
                <p className="text-3xl font-headline font-extrabold text-on-surface">142</p>
                <p className="text-sm text-on-surface-variant font-medium">Recipes Generated</p>
              </div>
            </div>
            <div className="bg-surface-container-low p-8 rounded-[2rem] flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-3xl">favorite</span>
              </div>
              <div>
                <p className="text-3xl font-headline font-extrabold text-on-surface">56</p>
                <p className="text-sm text-on-surface-variant font-medium">Saved to Favorites</p>
              </div>
            </div>
            <div className="bg-primary text-on-primary p-8 rounded-[2rem] flex items-center gap-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-12 -translate-y-12 blur-2xl"></div>
              <div className="z-10">
                <p className="font-headline font-bold text-xl leading-tight">Hungry for more?</p>
                <p className="text-sm opacity-80 mt-1">Unlock AI-powered wine pairings.</p>
                <button className="mt-4 bg-white text-primary px-6 py-2 rounded-full text-sm font-bold hover:scale-105 transition-transform">Get Pro</button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
    </>
  );
}
