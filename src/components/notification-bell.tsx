"use client";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

export function NotificationBell() { const[count,setCount]=useState(0);useEffect(()=>{if(!isSupabaseConfigured)return;const supabase=createClient();let channel:ReturnType<typeof supabase.channel>|undefined;void supabase.auth.getUser().then(async({data:{user}})=>{if(!user)return;const{count:unread}=await supabase.from("notifications").select("id",{count:"exact",head:true}).is("read_at",null);setCount(unread??0);channel=supabase.channel(`notificaciones:${user.id}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:`user_id=eq.${user.id}`},(payload)=>{const item=payload.new as{title?:string;message?:string};setCount(value=>value+1);toast(item.title??"Nueva notificación",{description:item.message});}).subscribe();});return()=>{if(channel)void supabase.removeChannel(channel)}},[]);return <Button variant="ghost" size="icon" aria-label={count?`${count} notificaciones sin leer`:"Notificaciones"} className="relative"><Bell className="size-4"/>{count>0&&<span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">{count>9?"9+":count}</span>}</Button>}
