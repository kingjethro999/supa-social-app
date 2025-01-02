import { StyleSheet, Text, View, TouchableOpacity, FlatList } from 'react-native';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import Icon from '../../assets/icons';
import { useRouter } from 'expo-router';
import Avatar from '../../components/Avatar';
import { fetchPosts } from '../../services/postService';
import PostCard from '../../components/PostCard';
import { supabase } from '../../lib/supabase';
import Loading from '../../components/Loading';

const Home = () => {
    const { user } = useAuth();
    const router = useRouter();
    const flatListRef = useRef(null);
    const isMounted = useRef(true);

    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [limit, setLimit] = useState(10);
    const [hasMore, setHasMore] = useState(true);
    const [hasNewNotification, setHasNewNotification] = useState(false);
    const [realtimeUpdate, setRealtimeUpdate] = useState(null);

    // Validate post data structure
    const isValidPost = useCallback((post) => {
        return post &&
            typeof post === 'object' &&
            post.id &&
            typeof post.id !== 'undefined' &&
            (!post.user || typeof post.user === 'object') &&
            (!post.comments || Array.isArray(post.comments));
    }, []);

    const getPosts = useCallback(async () => {
        if (!isMounted.current) return;

        try {
            setIsLoading(true);
            setError(null);
            const res = await fetchPosts(limit);

            if (!isMounted.current) return;

            if (res.success && Array.isArray(res.data)) {
                const validPosts = res.data.filter(isValidPost);

                if (validPosts.length < res.data.length) {
                    console.warn('Some posts were filtered out due to invalid data structure');
                }

                setPosts(validPosts);
                setHasMore(validPosts.length >= limit);
            } else {
                setError(res.error || 'Failed to fetch posts');
                setPosts([]);
            }
        } catch (err) {
            if (!isMounted.current) return;
            console.error('Error fetching posts:', err);
            setError('An unexpected error occurred while fetching posts');
            setPosts([]);
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    }, [limit, isValidPost]);

    const handlePostEvent = useCallback((payload) => {
        if (!payload || !isMounted.current) return;

        const eventType = payload.eventType;
        const newRecord = payload.new;
        const oldRecord = payload.old;

        if (!eventType) {
            console.warn('Invalid payload received:', payload);
            return;
        }

        setRealtimeUpdate({
            type: eventType,
            message: getUpdateMessage(eventType)
        });

        const timeoutId = setTimeout(() => {
            if (isMounted.current) {
                setRealtimeUpdate(null);
            }
        }, 3000);

        setPosts(currentPosts => {
            switch (eventType) {
                case 'INSERT':
                    if (isValidPost(newRecord)) {
                        if (flatListRef.current) {
                            setTimeout(() => {
                                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                            }, 100);
                        }
                        return [newRecord, ...currentPosts];
                    }
                    return currentPosts;

                case 'UPDATE':
                    if (!isValidPost(newRecord)) return currentPosts;
                    return currentPosts.map(post =>
                        post.id === newRecord.id ? { ...post, ...newRecord } : post
                    );

                case 'DELETE':
                    return currentPosts.filter(post => post.id !== oldRecord?.id);

                default:
                    console.warn('Unknown event type:', eventType);
                    return currentPosts;
            }
        });

        return () => clearTimeout(timeoutId);
    }, [isValidPost]);

    const renderPostCard = useCallback(({ item }) => {
        if (!isValidPost(item)) {
            console.warn('Invalid post item:', item);
            return null;
        }

        return (
            <PostCard
                item={item}
                currentUser={user || {}}
                router={router}
            />
        );
    }, [user, router, isValidPost]);

    const loadMore = useCallback(() => {
        if (!isLoading && hasMore) {
            setLimit(prevLimit => prevLimit + 10);
        }
    }, [isLoading, hasMore]);

    const handleNewNotification = async (payload) => {
        if (payload.eventType === 'INSERT' && payload.new.id) {
            setHasNewNotification(true);
        }
    };

    useEffect(() => {
        getPosts();
    }, [getPosts]);

    useEffect(() => {
        const postChannel = supabase
            .channel('posts')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'posts'
                },
                handlePostEvent
            )
            .subscribe(status => {
                if (status === 'SUBSCRIBED') {
                    console.log('Successfully subscribed to real-time updates');
                }
            });

        const notificationChannel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `receiverId=eq.${user.id}`
                },
                handleNewNotification
            )
            .subscribe(status => {
                if (status === 'SUBSCRIBED') {
                    console.log('Successfully subscribed to real-time updates');
                }
            });

        return () => {
            isMounted.current = false;
            postChannel.unsubscribe();
            notificationChannel.unsubscribe();
        };
    }, [handlePostEvent]);

    const getUpdateMessage = (eventType) => {
        switch (eventType) {
            case 'INSERT': return 'New post added!';
            case 'UPDATE': return 'Post updated';
            case 'DELETE': return 'Post removed';
            default: return '';
        }
    };

    const renderUpdateNotification = () => {
        if (!realtimeUpdate) return null;
        return (
            <View style={[
                styles.notification,
                realtimeUpdate.type === 'DELETE' && styles.notificationDelete
            ]}>
                <Text style={styles.notificationText}>
                    {realtimeUpdate.message}
                </Text>
            </View>
        );
    };

    return (
        <ScreenWrapper bg="white">
            <View style={styles.container}>
                {renderUpdateNotification()}

                <View style={styles.header}>
                    <Text style={styles.title}>VibeFlow</Text>
                    <View style={styles.icons}>
                        <TouchableOpacity
                            onPress={() => {
                                setHasNewNotification(false)
                                router.push('notifications')
                            }}
                            accessibilityLabel="Notifications"
                        >
                            <Icon
                                name="heart"
                                size={hp(3.2)}
                                strokeWidth={2}
                                color={theme.colors.text}
                            />
                            {hasNewNotification && <View style={styles.dot} />}
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push('newPost')}
                            accessibilityLabel="Create new post"
                        >
                            <Icon
                                name="plus"
                                size={hp(3.2)}
                                strokeWidth={2}
                                color={theme.colors.text}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push('profile')}
                            accessibilityLabel="View profile"
                        >
                            <Avatar
                                uri={user?.image}
                                size={hp(4.3)}
                                rounded={theme.radius.sm}
                                style={{ borderWidth: 1 }}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={posts}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listStyle}
                        keyExtractor={item => item?.id?.toString() || Math.random().toString()}
                        renderItem={renderPostCard}
                        onEndReached={loadMore}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={
                            <View style={{ marginVertical: posts.length === 0 ? 200 : 30 }}>
                                {isLoading && <Loading />}
                            </View>
                        }
                        ListEmptyComponent={
                            !isLoading && (
                                <Text style={styles.emptyText}>
                                    No posts available
                                </Text>
                            )
                        }
                    />
                )}
            </View>
        </ScreenWrapper>
    );
};

export default Home;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        // marginBottom: 10,
        marginVertical:wp(4),
        marginHorizontal: wp(4),
    },
    title: {
        color: theme.colors.text,
        fontSize: hp(3.2),
        fontWeight: theme.fonts.bold,
    },
    icons: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 18,
    },
    listStyle: {
        paddingTop: 20,
        paddingHorizontal: wp(4)
    },
    errorText: {
        textAlign: 'center',
        color: theme.colors.error,
        marginTop: 20,
        fontSize: hp(2),
    },
    emptyText: {
        textAlign: 'center',
        color: theme.colors.text,
        marginTop: 20,
        fontSize: hp(2),
    },
    notification: {
        position: 'absolute',
        top: 0,
        left: wp(4),
        right: wp(4),
        backgroundColor: theme.colors.primary,
        padding: 10,
        borderRadius: theme.radius.sm,
        zIndex: 1000,
    },
    notificationDelete: {
        backgroundColor: theme.colors.error,
    },
    notificationText: {
        color: 'white',
        textAlign: 'center',
        fontSize: hp(1.8),
        fontWeight: '500',
    },
    noPosts: {
        fontSize: hp(2),
        textAlign: 'center',
        color: theme.colors.text,
    },
    dot: {
        position: 'absolute',
        right: -2,
        top: 0,
        height: hp(1.2),
        width: hp(1.2),
        borderRadius: hp(0.6),
        backgroundColor: theme.colors.roseLight,
    }
});