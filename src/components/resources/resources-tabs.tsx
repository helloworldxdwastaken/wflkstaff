'use client'

import { useState } from 'react'
import { createInfoItem, deleteInfoItem, updateInfoItem } from '@/lib/actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Lock, FileText, Link as LinkIcon, Plus, Trash2, Copy, ExternalLink, MoreVertical, Pencil, Globe, Key, File } from 'lucide-react'
import { useFormStatus } from 'react-dom'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface InfoItem {
    id: string
    title: string
    description: string | null
    content: string
    username: string | null
    type: string
    visibleTo: string
    createdAt: Date
    updatedAt: Date
}

interface ResourcesTabsProps {
    links: InfoItem[]
    secrets: InfoItem[]
    files: InfoItem[]
    allItems: InfoItem[]
}

function SubmitButton({ label }: { label: string }) {
    const { pending } = useFormStatus()
    return (
        <Button disabled={pending} type="submit" className="bg-indigo-600 hover:bg-indigo-700">
            {pending ? 'Saving...' : label}
        </Button>
    )
}

function ResourceCard({ item, onEdit, onDelete }: { item: InfoItem; onEdit: (item: InfoItem) => void; onDelete: (id: string) => void }) {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        alert("Copied to clipboard!")
    }

    return (
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm group hover:border-indigo-500/30 transition-all">
            <CardHeader className="pb-3 relative">
                <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                        <div className="mt-1">
                            {item.type === 'SECRET' && <Lock className="h-5 w-5 text-amber-500" />}
                            {item.type === 'LINK' && <LinkIcon className="h-5 w-5 text-blue-400" />}
                            {item.type === 'FILE' && <FileText className="h-5 w-5 text-emerald-400" />}
                        </div>
                        <div>
                            <CardTitle className="text-base text-slate-200 leading-tight">{item.title}</CardTitle>
                            {item.description && <CardDescription className="text-slate-400 text-xs mt-1">{item.description}</CardDescription>}
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-slate-300 -mt-1 -mr-2">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                            <DropdownMenuItem className="cursor-pointer hover:bg-slate-800" onClick={() => onEdit(item)}>
                                <Pencil className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-red-950/20 cursor-pointer" onClick={() => onDelete(item.id)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
                {item.type === 'SECRET' ? (
                    <>
                        {item.username && (
                            <div className="bg-slate-950/50 rounded p-2.5 flex items-center justify-between border border-slate-800/50">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-500 uppercase">User</span>
                                    <code className="text-xs text-slate-300 font-mono truncate max-w-[150px] sm:max-w-[200px]">
                                        {item.username}
                                    </code>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-slate-500 hover:text-indigo-400"
                                    onClick={() => copyToClipboard(item.username!)}
                                    title="Copy Username"
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        )}
                        <div className="bg-slate-950/50 rounded p-2.5 flex items-center justify-between border border-slate-800/50">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500 uppercase">Pass</span>
                                <code className="text-xs text-slate-400 font-mono">••••••••••••</code>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-slate-500 hover:text-indigo-400"
                                onClick={() => copyToClipboard(item.content)}
                                title="Copy Password"
                            >
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="bg-slate-950/50 rounded p-2.5 flex items-center justify-between border border-slate-800/50">
                        <code className="text-xs text-slate-400 font-mono truncate max-w-[180px] sm:max-w-[250px]">
                            {item.content}
                        </code>
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-slate-500 hover:text-indigo-400"
                                onClick={() => copyToClipboard(item.content)}
                                title="Copy"
                            >
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                            {(item.type === 'LINK' || item.type === 'FILE') && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-6 w-6 text-slate-500 ${item.type === 'FILE' ? 'hover:text-emerald-400' : 'hover:text-blue-400'}`}
                                    onClick={() => window.open(item.content, '_blank')}
                                    title={item.type === 'FILE' ? 'Open in Drive' : 'Open Link'}
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function EmptyState({ type, onAdd }: { type: string; onAdd: () => void }) {
    const labels: Record<string, { title: string; desc: string; icon: React.ReactNode }> = {
        LINK: { title: 'No links yet', desc: 'Add useful links for the team', icon: <Globe className="h-8 w-8 text-blue-400/50" /> },
        SECRET: { title: 'No secrets yet', desc: 'Store passwords and API keys securely', icon: <Key className="h-8 w-8 text-amber-400/50" /> },
        FILE: { title: 'No files yet', desc: 'Add Google Drive links to shared files', icon: <File className="h-8 w-8 text-emerald-400/50" /> },
        ALL: { title: 'No resources yet', desc: 'Add your first resource to get started', icon: <FileText className="h-8 w-8 text-slate-400/50" /> }
    }
    const { title, desc, icon } = labels[type] || labels.ALL

    return (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-lg">
            <div className="flex justify-center mb-3">{icon}</div>
            <p className="text-slate-400 font-medium">{title}</p>
            <p className="text-slate-500 text-sm mt-1">{desc}</p>
            <Button onClick={onAdd} size="sm" className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" /> Add Resource
            </Button>
        </div>
    )
}

export function ResourcesTabs({ links, secrets, files, allItems }: ResourcesTabsProps) {
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<InfoItem | null>(null)
    const [defaultType, setDefaultType] = useState<string>('LINK')
    const [addFormType, setAddFormType] = useState<string>('LINK')
    const [editFormType, setEditFormType] = useState<string>('LINK')

    async function handleAdd(formData: FormData) {
        setIsAddOpen(false)
        await createInfoItem(null, formData)
    }

    async function handleEdit(formData: FormData) {
        setEditingItem(null)
        await updateInfoItem(null, formData)
    }

    async function handleDelete(id: string) {
        if (confirm("Delete this resource?")) {
            await deleteInfoItem(id)
        }
    }

    const openAddWithType = (type: string) => {
        setDefaultType(type)
        setAddFormType(type)
        setIsAddOpen(true)
    }

    const openEditItem = (item: InfoItem) => {
        setEditingItem(item)
        setEditFormType(item.type)
    }

    return (
        <div className="space-y-6">
            {/* Add Dialog */}
            <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) setAddFormType('LINK'); }}>
                <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                    <DialogHeader>
                        <DialogTitle>Add New Resource</DialogTitle>
                    </DialogHeader>
                    <form action={handleAdd} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-slate-200">Title</Label>
                            <Input id="title" name="title" placeholder="e.g. WiFi Password" required className="bg-slate-800/50 border-slate-700 text-slate-100" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-slate-200">Description (Optional)</Label>
                            <Input id="description" name="description" placeholder="Briefly explain what this is for" className="bg-slate-800/50 border-slate-700 text-slate-100" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type" className="text-slate-200">Type</Label>
                            <select 
                                id="type" 
                                name="type" 
                                value={addFormType}
                                onChange={(e) => setAddFormType(e.target.value)}
                                className="w-full h-10 rounded-md border border-slate-700 bg-slate-800 text-slate-100 px-3 py-2 text-sm"
                            >
                                <option value="LINK">Link</option>
                                <option value="SECRET">Secret (Username/Password)</option>
                                <option value="FILE">File (Google Drive Link)</option>
                            </select>
                        </div>
                        {addFormType === 'SECRET' && (
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-slate-200">Username / Email</Label>
                                <Input id="username" name="username" placeholder="username or email" className="bg-slate-800/50 border-slate-700 text-slate-100" />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="content" className="text-slate-200">
                                {addFormType === 'SECRET' ? 'Password / Key' : 'Content / URL'}
                            </Label>
                            <Input 
                                id="content" 
                                name="content" 
                                type={addFormType === 'SECRET' ? 'password' : 'text'}
                                placeholder={addFormType === 'SECRET' ? 'password or API key' : 'https://...'}
                                required 
                                className="bg-slate-800/50 border-slate-700 text-slate-100" 
                            />
                        </div>
                        <DialogFooter>
                            <SubmitButton label="Add Resource" />
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editingItem} onOpenChange={(open) => { if (!open) { setEditingItem(null); setEditFormType('LINK'); } }}>
                <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                    <DialogHeader>
                        <DialogTitle>Edit Resource</DialogTitle>
                    </DialogHeader>
                    {editingItem && (
                        <form action={handleEdit} className="space-y-4 mt-4">
                            <input type="hidden" name="itemId" value={editingItem.id} />
                            <div className="space-y-2">
                                <Label htmlFor="edit-title" className="text-slate-200">Title</Label>
                                <Input id="edit-title" name="title" defaultValue={editingItem.title} required className="bg-slate-800/50 border-slate-700 text-slate-100" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-description" className="text-slate-200">Description (Optional)</Label>
                                <Input id="edit-description" name="description" defaultValue={editingItem.description || ''} className="bg-slate-800/50 border-slate-700 text-slate-100" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-type" className="text-slate-200">Type</Label>
                                <select 
                                    id="edit-type" 
                                    name="type" 
                                    value={editFormType}
                                    onChange={(e) => setEditFormType(e.target.value)}
                                    className="w-full h-10 rounded-md border border-slate-700 bg-slate-800 text-slate-100 px-3 py-2 text-sm"
                                >
                                    <option value="LINK">Link</option>
                                    <option value="SECRET">Secret (Username/Password)</option>
                                    <option value="FILE">File (Google Drive Link)</option>
                                </select>
                            </div>
                            {editFormType === 'SECRET' && (
                                <div className="space-y-2">
                                    <Label htmlFor="edit-username" className="text-slate-200">Username / Email</Label>
                                    <Input id="edit-username" name="username" defaultValue={editingItem.username || ''} placeholder="username or email" className="bg-slate-800/50 border-slate-700 text-slate-100" />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="edit-content" className="text-slate-200">
                                    {editFormType === 'SECRET' ? 'Password / Key' : 'Content / URL'}
                                </Label>
                                <Input 
                                    id="edit-content" 
                                    name="content" 
                                    type={editFormType === 'SECRET' ? 'password' : 'text'}
                                    defaultValue={editingItem.content} 
                                    required 
                                    className="bg-slate-800/50 border-slate-700 text-slate-100" 
                                />
                            </div>
                            <DialogFooter>
                                <SubmitButton label="Save Changes" />
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Tabs */}
            <Tabs defaultValue="all" className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <TabsList className="bg-slate-900 border border-slate-800">
                        <TabsTrigger value="all" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                            All ({allItems.length})
                        </TabsTrigger>
                        <TabsTrigger value="links" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                            <Globe className="h-4 w-4 mr-1.5" />
                            Links ({links.length})
                        </TabsTrigger>
                        <TabsTrigger value="secrets" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                            <Key className="h-4 w-4 mr-1.5" />
                            Secrets ({secrets.length})
                        </TabsTrigger>
                        <TabsTrigger value="files" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                            <File className="h-4 w-4 mr-1.5" />
                            Files ({files.length})
                        </TabsTrigger>
                    </TabsList>

                    <Button onClick={() => openAddWithType('LINK')} className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="h-4 w-4 mr-2" /> Add Resource
                    </Button>
                </div>

                <TabsContent value="all" className="mt-6">
                    {allItems.length === 0 ? (
                        <EmptyState type="ALL" onAdd={() => openAddWithType('LINK')} />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {allItems.map((item) => (
                                <ResourceCard key={item.id} item={item} onEdit={openEditItem} onDelete={handleDelete} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="links" className="mt-6">
                    {links.length === 0 ? (
                        <EmptyState type="LINK" onAdd={() => openAddWithType('LINK')} />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {links.map((item) => (
                                <ResourceCard key={item.id} item={item} onEdit={openEditItem} onDelete={handleDelete} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="secrets" className="mt-6">
                    {secrets.length === 0 ? (
                        <EmptyState type="SECRET" onAdd={() => openAddWithType('SECRET')} />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {secrets.map((item) => (
                                <ResourceCard key={item.id} item={item} onEdit={openEditItem} onDelete={handleDelete} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="files" className="mt-6">
                    {files.length === 0 ? (
                        <EmptyState type="FILE" onAdd={() => openAddWithType('FILE')} />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {files.map((item) => (
                                <ResourceCard key={item.id} item={item} onEdit={openEditItem} onDelete={handleDelete} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
