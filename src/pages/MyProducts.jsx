import React, { useState } from 'react';
import { 
  Search, 
  MoreHorizontal, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock,
  Filter,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

const MyProducts = () => {
  const [activeTab, setActiveTab] = useState('all');

  const products = [
    { id: '1', title: 'Vitamin C Serum 20%', status: 'Published', date: '2024-03-24', price: 24.99, profit: 15.50, views: 245 },
    { id: '2', title: 'Wireless Bluetooth Buds', status: 'Draft', date: '2024-03-23', price: 29.99, profit: 12.00, views: 0 },
    { id: '3', title: 'Leather RFID Wallet', status: 'Published', date: '2024-03-22', price: 14.50, profit: 8.20, views: 890 },
    { id: '4', title: 'Yoga Mat Alignment', status: 'Archived', date: '2024-03-20', price: 34.00, profit: 14.00, views: 12 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">My Products</h1>
          <p className="text-slate-500 mt-1">Manage all your imported and active listings.</p>
        </div>
        <div className="flex gap-4">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Search products..." className="input-field pl-9 bg-white" />
           </div>
           <button className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <Filter size={18} />
           </button>
        </div>
      </div>

      <div className="glass-card rounded-3xl flex flex-col overflow-hidden">
         <div className="flex border-b border-slate-100 px-6 pt-6">
            {['All', 'Published', 'Draft', 'Archived'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`px-6 py-4 text-sm font-bold transition-all relative ${
                  activeTab === tab.toLowerCase() ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab}
                {activeTab === tab.toLowerCase() && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                )}
              </button>
            ))}
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <th className="px-8 py-4">Product Name</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4">Price / Profit</th>
                  <th className="px-8 py-4">Performance</th>
                  <th className="px-8 py-4">Date</th>
                  <th className="px-8 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                       <span className="font-bold text-sm text-slate-700 block max-w-xs truncate">{p.title}</span>
                       <span className="text-[10px] text-slate-400 font-mono">ID: {p.id}</span>
                    </td>
                    <td className="px-8 py-5">
                       <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                         p.status === 'Published' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                       }`}>
                         {p.status === 'Published' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                         {p.status}
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900">${p.price}</span>
                          <span className="text-xs text-emerald-600 font-bold">+${p.profit} profit</span>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                           <Eye size={14} className="text-slate-300" />
                           <span className="text-xs font-bold text-slate-600">{p.views} views</span>
                        </div>
                    </td>
                    <td className="px-8 py-5">
                        <span className="text-xs font-medium text-slate-400">{p.date}</span>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 hover:bg-white hover:shadow-md rounded-lg text-slate-400 hover:text-primary transition-all">
                             <Edit3 size={16} />
                          </button>
                          <button className="p-2 hover:bg-white hover:shadow-md rounded-lg text-slate-400 hover:text-primary transition-all">
                             <ExternalLink size={16} />
                          </button>
                          <button className="p-2 hover:bg-white hover:shadow-md rounded-lg text-slate-400 hover:text-rose-500 transition-all">
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default MyProducts;
