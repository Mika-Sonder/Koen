import type { MediaItem } from "@/types/media";
import { MediaCard } from "@/components/media-card";
export function MediaGrid({ media, priority = false }: { media: MediaItem[]; priority?: boolean }) { return <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">{media.map((item, index) => <MediaCard key={item.id} media={item} priority={priority && index < 4}/>)}</div>; }
