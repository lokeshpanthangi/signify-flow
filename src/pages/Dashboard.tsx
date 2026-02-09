import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  FileSignature,
  Clock,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Eye,
  Download,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { mockSentDocuments, mockReceivedDocuments, Document } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: FileText, label: 'My Documents', id: 'documents' },
  { icon: Users, label: 'Shared with Me', id: 'shared' },
  { icon: Settings, label: 'Settings', id: 'settings' },
];

const StatusBadge = ({ status }: { status: Document['status'] }) => {
  const map = {
    signed: { class: 'bg-success/10 text-success border-success/20', label: 'Signed' },
    pending: { class: 'bg-warning/10 text-warning border-warning/20', label: 'Pending' },
    declined: { class: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Declined' },
  };
  const s = map[status];
  return <Badge variant="outline" className={s.class}>{s.label}</Badge>;
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const docs = activeTab === 'sent' ? mockSentDocuments : mockReceivedDocuments;

  const stats = [
    { icon: Clock, label: 'Pending Requests', value: mockSentDocuments.filter(d => d.status === 'pending').length + mockReceivedDocuments.filter(d => d.status === 'pending').length, color: 'text-warning' },
    { icon: CheckCircle2, label: 'Completed Docs', value: mockSentDocuments.filter(d => d.status === 'signed').length + mockReceivedDocuments.filter(d => d.status === 'signed').length, color: 'text-success' },
    { icon: XCircle, label: 'Declined', value: mockSentDocuments.filter(d => d.status === 'declined').length + mockReceivedDocuments.filter(d => d.status === 'declined').length, color: 'text-destructive' },
  ];

  const handleDocClick = (doc: Document) => {
    navigate(`/sign/${doc.id}`);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <FileSignature className="h-7 w-7 text-sidebar-primary" />
          <span className="text-lg font-semibold">SignFlow</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveNav(item.id); setSidebarOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                activeNav === item.id
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 text-sm">
            <p className="font-medium">{user?.name}</p>
            <p className="text-xs text-sidebar-muted">{user?.email}</p>
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1">
        {/* Top bar */}
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-8">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
            <Menu className="h-6 w-6 text-foreground" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        </header>

        <motion.main
          className="p-4 lg:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-4 rounded-lg border border-border bg-card p-5">
                <s.icon className={`h-8 w-8 ${s.color}`} />
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="mb-4 flex gap-1 rounded-lg border border-border bg-muted p-1">
            {(['sent', 'received'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  activeTab === tab ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                {tab === 'sent' ? 'Sent Documents' : 'Received Documents'}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Document Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Date Modified</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc) => (
                    <tr
                      key={doc.id}
                      className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/30"
                      onClick={() => handleDocClick(doc)}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{doc.name}</td>
                      <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
                      <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{doc.dateModified}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDocClick(doc); }}>
                              <Eye className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                              <Download className="mr-2 h-4 w-4" /> Download
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default Dashboard;
