import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/components/auth-provider';
import { TicketService } from '@/services/ticket-service';
import { FiveManageService } from '@/services/fivemanage-service';
import { TicketMessage } from '@/types/ticket';
import { cn } from '@/lib/utils';
import { Send, Lock, User as UserIcon, Image as ImageIcon, Loader2 } from 'lucide-react';
import { MediaEmbed, LinkifiedText } from '@/components/ui/media-embed';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
    ticketId: string;
}

export function TicketChat({ ticketId }: Props) {
    const { user, userData } = useAuth();
    const [messages, setMessages] = useState<TicketMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const unsubscribe = TicketService.subscribeToMessages(ticketId, (msgs) => {
            setMessages(msgs);
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });
        return () => unsubscribe();
    }, [ticketId]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        try {
            await TicketService.addMessage(
                ticketId,
                user.uid,
                userData?.name || user.displayName || user.email || 'User',
                newMessage,
                isInternal
            );
            setNewMessage('');
        } catch (err) {
            console.error(err);
            alert('Failed to send message');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        try {
            const url = await FiveManageService.uploadImage(file);
            // Auto-send the image as a markdown formatted message
            await TicketService.addMessage(
                ticketId,
                user.uid,
                userData?.name || user.displayName || user.email || 'User',
                `![Image](${url})`,
                isInternal
            );
        } catch (err) {
            console.error(err);
            alert('Image upload failed. Check API configuration.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const STAFF_ROLES = ['role_support', 'role_sr_support', 'role_mod', 'role_sr_mod', 'role_admin', 'role_head_admin', 'role_owner', 'role_developer'];
    const isStaff = (userData?.roles || []).some((r: string) => STAFF_ROLES.includes(r));

    return (
        <div className="flex flex-col h-full bg-[#161b22]">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 && (
                    <div className="text-center text-[#8b949e] py-10">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                )}
                {messages.map((msg) => {
                    if (msg.isInternal && !isStaff) return null;

                    const isMe = msg.authorId === user?.uid;

                    return (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex items-start gap-4 max-w-[90%]",
                                isMe ? "ml-auto flex-row-reverse" : ""
                            )}
                        >
                            {/* Avatar */}
                            <div className={cn(
                                "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-[#0d1117]",
                                isMe ? "bg-[#f97316] text-white" : "bg-[#30363d] text-[#c9d1d9]"
                            )}>
                                {msg.authorName?.charAt(0) || <UserIcon className="h-4 w-4" />}
                            </div>

                            <div className={cn("flex flex-col min-w-0", isMe ? "items-end" : "items-start")}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-[#c9d1d9]">
                                        {msg.authorName}
                                    </span>
                                    {msg.isInternal && (
                                        <span className="flex items-center gap-1 text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-1 rounded font-bold uppercase">
                                            <Lock className="h-2 w-2" /> Staff Note
                                        </span>
                                    )}
                                    <span className="text-[10px] text-[#8b949e]">
                                        {msg.createdAt?.seconds
                                            ? formatMessageTime(msg.createdAt.seconds)
                                            : '...'}
                                    </span>
                                </div>

                                <div
                                    className={cn(
                                        "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm break-words max-w-full prose prose-invert prose-sm [&>p]:mb-0 [&>p:last-child]:mb-0 [&_a]:text-[#f97316] [&_a]:underline",
                                        isMe
                                            ? "bg-[#f97316] text-white rounded-tr-none prose-p:text-white prose-a:text-white"
                                            : msg.isInternal
                                                ? "bg-red-900/20 border border-red-500/30 text-red-100 rounded-tl-none"
                                                : "bg-[#21262d] border border-[#30363d] text-[#c9d1d9] rounded-tl-none"
                                    )}
                                >
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            img: ({ node, ...props }: any) => <img {...props} className="max-w-full rounded-lg my-2" />
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                    <MediaEmbed content={msg.content} />
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 border-t border-[#30363d] bg-[#0d1117]/30">
                {/* Hidden File Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                />

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="p-3 rounded-xl bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-white hover:bg-[#30363d] transition-colors"
                        title="Upload Image"
                    >
                        {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
                    </button>

                    <div className="relative flex-1">
                        <input
                            className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] transition-all"
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                        />
                    </div>

                    {isStaff && (
                        <button
                            type="button"
                            onClick={() => setIsInternal(!isInternal)}
                            className={cn(
                                "p-3 rounded-xl transition-all border",
                                isInternal
                                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                                    : "bg-[#21262d] border-[#30363d] text-[#8b949e] hover:text-white hover:bg-[#30363d]"
                            )}
                            title="Internal Note (Staff Only)"
                        >
                            <Lock className="h-5 w-5" />
                        </button>
                    )}

                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-[#f97316] text-white px-5 rounded-xl hover:bg-[#ea580c] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-sm flex items-center justify-center"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </div>
                {isInternal && isStaff && (
                    <p className="text-xs text-red-400 mt-2 flex items-center gap-1.5 font-medium ml-1">
                        <Lock className="h-3 w-3" />
                        Internal Note: Visible only to staff.
                    </p>
                )}
            </form>
        </div>
    );
}

function formatMessageTime(seconds: number) {
    return new Date(seconds * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
