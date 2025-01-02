import { Alert, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { theme } from '../constants/theme'
import { hp, stripHtmlTags, wp } from '../helpers/common'
import Avatar from './Avatar'
import moment from 'moment'
import AutoHeightWebView from 'react-native-autoheight-webview';
import Icon from '../assets/icons'
import { Image } from 'expo-image'
import { downloadFile, getSupabaseFileUrl } from '../services/imageService'
import { Video } from 'expo-av'
import { createPostLike, removePostLike } from '../services/postService'
import * as FileSystem from 'expo-file-system';
import shareFile from './FileSharing'
import Loading from './Loading'

const PostCard = ({
    item,
    currentUser,
    router,
    hasShadow = true,
    showMoreIcon = true,
    showDelete = false,
    onDelete = () => { },
    onEdit = () => { }
}) => {
    const shadowStyles = {
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 1,
    }

    // Initialize likes with empty array if undefined
    const [likes, setLikes] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Safely set likes with fallback to empty array
        setLikes(item?.postLikes || []);
    }, [item?.postLikes]);

    const openPostDetails = () => {
        if (!showMoreIcon) return null;
        router.push({
            pathname: '/(main)/postDetails',
            params: { postId: item?.id }
        });
    }

    const onLike = async () => {
        if (!currentUser?.id || !item?.id) {
            Alert.alert('Error', 'Unable to process like at this time');
            return;
        }

        if (liked) {
            //remove like
            let updatedLikes = likes.filter(like => like.userId != currentUser?.id);
            setLikes([...updatedLikes])
            let res = await removePostLike(item?.id, currentUser?.id);
            if (!res.success) {
                Alert.alert('Error', 'Something went wrong!')
                // Revert likes state on error
                setLikes([...likes]);
            }
        } else {
            //create like
            let data = {
                userId: currentUser?.id,
                postId: item?.id,
            }
            setLikes([...likes, data])
            let res = await createPostLike(data);
            if (!res.success) {
                Alert.alert('Error', 'Something went wrong!')
                // Revert likes state on error
                setLikes([...likes]);
            }
        }
    }

    const onShare = async () => {
        try {
            setLoading(true);
            const message = stripHtmlTags(item?.body || '');
            const fileUrl = item?.file ? getSupabaseFileUrl(item?.file).uri : null;

            const result = await shareFile({ fileUrl, message });

            if (!result.success) {
                throw new Error(result.error?.message || 'Sharing failed');
            }
        } catch (error) {
            Alert.alert(
                'Sharing Failed',
                'Unable to share this post at this time. Please try again later.'
            );
            console.error('Share error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePostDelete = () => {
        Alert.alert('Confirm', "Are you sure you want to delete this?", [
            {
                text: "Cancel",
                onPress: () => console.log('modal cancelled'),
                style: 'cancel'
            },
            {
                text: "Delete",
                onPress: () => onDelete(item),
                style: 'destructive'
            }
        ])
    }

    // Safely check if user has liked the post
    const liked = Array.isArray(likes) && likes.some(like => like.userId == currentUser?.id);
    const createdAt = moment(item?.created_at).format('MMM D');
    const commentCount = item?.comments?.[0]?.count || 0;

    return (
        <View style={[styles.container, hasShadow && shadowStyles]}>
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <Avatar
                        size={hp(4.5)}
                        uri={item?.user?.image}
                        rounded={theme.radius.md}
                    />
                    <View style={{ gap: 2 }}>
                        <Text style={styles.username}>{item?.user?.name || 'Unknown User'}</Text>
                        <Text style={styles.postTime}>{createdAt}</Text>
                    </View>
                </View>
                {
                    showMoreIcon && (
                        <TouchableOpacity onPress={openPostDetails}>
                            <Icon name="threeDotsHorizontal" size={hp(3.4)} strokeWidth={3} color={theme.colors.text} />
                        </TouchableOpacity>
                    )
                }

                {
                    showDelete && currentUser?.id === item?.userId && (
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => onEdit(item)}>
                                <Icon name="edit" size={hp(2.5)} color={theme.colors.text} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handlePostDelete}>
                                <Icon name="delete" size={hp(2.5)} color={theme.colors.rose} />
                            </TouchableOpacity>
                        </View>
                    )
                }
            </View>

            <View style={styles.content}>
                {item?.body && (
                    <View style={styles.postBody}>
                        <AutoHeightWebView
                            style={{
                                width: '100%',
                                marginTop: 10
                            }}
                            customStyle={`
                                * { 
                                    font-family: -apple-system, system-ui;
                                    font-size: 16px;
                                    color: ${theme.colors.text};
                                }
                                p { margin: 0; }
                            `}
                            viewportContent={'width=device-width, user-scalable=no'}
                            source={{ html: item.body }}
                        />
                    </View>
                )}

                {item?.file && item?.file.includes('postImage') && (
                    <Image
                        source={getSupabaseFileUrl(item.file)}
                        transition={100}
                        style={styles.postMedia}
                        resizeMode='contain'
                    />
                )}

                {item?.file && item?.file?.includes('postVideo') && (
                    <Video
                        style={[styles.postMedia, { height: hp(30) }]}
                        source={getSupabaseFileUrl(item.file)}
                        useNativeControls
                        resizeMode='cover'
                        isLooping
                    />
                )}

                <View style={styles.footer}>
                    <View style={styles.footerButton}>
                        <TouchableOpacity onPress={onLike}>
                            <Icon 
                                name="heart" 
                                size={25} 
                                fill={liked ? theme.colors.rose : 'transparent'} 
                                color={liked ? theme.colors.rose : theme.colors.textLight} 
                            />
                        </TouchableOpacity>
                        <Text style={styles.count}>{likes.length}</Text>
                    </View>
                    <View style={styles.footerButton}>
                        <TouchableOpacity onPress={openPostDetails}>
                            <Icon name="comment" size={25} color={theme.colors.textLight} />
                        </TouchableOpacity>
                        <Text style={styles.count}>{commentCount}</Text>
                    </View>
                    <View style={styles.footerButton}>
                        {loading ? (
                            <Loading size="small" />
                        ) : (
                            <TouchableOpacity onPress={onShare}>
                                <Icon name="share" size={23} color={theme.colors.textLight} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </View>
    )
}

export default PostCard

const styles = StyleSheet.create({
    container: {
        gap: 10,
        marginBottom: 15,
        borderRadius: theme.radius.xxl * 1.1,
        borderCurve: 'continuous',
        padding: 10,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderWidth: 0.5,
        borderColor: theme.colors.gray,
        shadowColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    username: {
        fontSize: hp(1.7),
        color: theme.colors.textDark,
        fontWeight: theme.fonts.medium,
    },
    postTime: {
        fontSize: hp(1.4),
        color: theme.colors.textLight,
        fontWeight: theme.fonts.medium,
    },
    content: {
        gap: 10,
    },
    postMedia: {
        height: hp(30),
        width: '100%',
        borderCurve: 'continuous',
    },
    postBody: {
        marginLeft: 5,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    footerButton: {
        marginLeft: 5,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 18,
    },
    count: {
        color: theme.colors.text,
        fontSize: hp(1.8)
    },
})