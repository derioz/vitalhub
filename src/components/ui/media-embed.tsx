'use client';

import { Play } from 'lucide-react';

interface Props {
    content: string;
}

export function MediaEmbed({ content }: Props) {
    // Helper to extract URLs
    const extractUrls = (text: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.match(urlRegex) || [];
    };

    const urls = extractUrls(content);
    const mediaLinks = urls.filter(url =>
        url.includes('youtube.com') ||
        url.includes('youtu.be') ||
        url.includes('medal.tv') ||
        url.includes('streamable.com')
    );

    if (mediaLinks.length === 0) return null;

    return (
        <div className="mt-3 space-y-3">
            {mediaLinks.map((url, i) => {
                let embedUrl = '';
                let type = '';

                // YouTube
                if (url.includes('youtube.com/watch')) {
                    const videoId = new URL(url).searchParams.get('v');
                    if (videoId) {
                        embedUrl = `https://www.youtube.com/embed/${videoId}`;
                        type = 'YouTube';
                    }
                } else if (url.includes('youtu.be')) {
                    const videoId = url.split('/').pop();
                    if (videoId) {
                        embedUrl = `https://www.youtube.com/embed/${videoId}`;
                        type = 'YouTube';
                    }
                }

                // Medal.tv
                else if (url.includes('medal.tv/games')) {
                    // Medal embeds usually require specific iframe structures, 
                    // but often just replacing 'clips' with 'clip' or appending params works.
                    // For robustness, we often need the clip ID.
                    // Standard Medal link: https://medal.tv/games/[game]/clips/[id]/[hash]
                    const parts = url.split('/clips/');
                    if (parts.length > 1) {
                        const clipId = parts[1].split('/')[0];
                        embedUrl = `https://medal.tv/clip/${clipId}?autoplay=0&muted=0&loop=0`;
                        type = 'Medal';
                    }
                }

                // Streamable
                else if (url.includes('streamable.com')) {
                    const videoId = url.split('/').pop()?.split('?')[0];
                    if (videoId) {
                        embedUrl = `https://streamable.com/e/${videoId}`;
                        type = 'Streamable';
                    }
                }

                if (!embedUrl) return null;

                return (
                    <div key={i} className="rounded-xl overflow-hidden bg-black/50 border border-[#30363d] max-w-md shadow-lg">
                        <div className="relative pt-[56.25%] bg-black">
                            <iframe
                                src={embedUrl}
                                className="absolute top-0 left-0 w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={`${type} Embed`}
                            />
                        </div>
                        <div className="px-3 py-2 bg-[#161b22] border-t border-[#30363d] flex items-center gap-2 text-[10px] text-[#8b949e]">
                            <Play className="h-3 w-3" />
                            <span>{type} Video</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Function to render text with clickable links
export function LinkifiedText({ text }: { text: string }) {
    const parts = text.split(/(https?:\/\/[^\s]+)/g);
    return (
        <span>
            {parts.map((part, i) => {
                if (part.match(/https?:\/\/[^\s]+/)) {
                    return (
                        <a
                            key={i}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#f97316] hover:underline break-all"
                        >
                            {part}
                        </a>
                    );
                }
                return part;
            })}
        </span>
    );
}
