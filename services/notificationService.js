import { supabase } from "../lib/supabase";

export const createNotification = async (notification) => {
    try {

        const { data, error } = await supabase
            .from('notifications')
            .insert(notification)
            .select()
            .single();

        if (error) {
            console.error('Supabase notification error:', error);
            return { success: false, msg: error.message || 'Could not create the notification' };
        }

        return { success: true, data: data };
    } catch (error) {
        console.error('Notification creation error:', error);
        return { success: false, msg: error.message || 'Could not create the notification' };
    }
}

export const fetchNotifications = async (receiverId) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select(`
               *,
               sender: senderId(id, name, image)
            `)
            .eq('receiverId', receiverId)
            .order("created_at", { ascending: false })

        if (error) {
            console.log('Fetch Notifications details error: ', error);
            return { success: false, msg: 'Could not Fetch the Notifications' };
        }
        return { success: true, data: data };
    } catch (error) {
        console.log('Fetch Notifications detais error: ', error);
        return { success: false, msg: 'Could not Fetch the Notifications' };
    }
}