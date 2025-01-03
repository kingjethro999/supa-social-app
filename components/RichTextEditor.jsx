import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor'
import { theme } from '../constants/theme'

const RichTextEditor = ({ editorRef, onChange }) => {
    return (
        <View style={{ minHeight: 285 }}>
            <RichToolbar
                actions={[
                    actions.setStrikethrough,
                    actions.removeFormat,
                    actions.setBold,
                    actions.setItalic,
                    actions.insertOrderedList,
                    actions.code,
                    actions.insertLink,
                    actions.blockquote,
                    actions.line,
                    actions.alignCenter,
                    actions.alignLeft,
                    actions.alignRight,
                ]}
                style={styles.richBar}
                flatContainerStyle={styles.listStyle}
                selectedIconTint={theme.colors.primaryDark}
                editor={editorRef}
                disabled={false}
            />

            <RichEditor
                ref={editorRef}
                containerStyle={styles.rich}
                flatContainerStyle={styles.flatStyle}
                editorStyle={styles.contentStyle}
                placeholder={"What's on your mind?"}
                onChange={onChange}
            />
        </View>
    )
}

export default RichTextEditor

const styles = StyleSheet.create({
    richBar: {
        borderTopRightRadius: theme.radius.xl,
        borderTopLeftRadius: theme.radius.xl,
        backgroundColor: theme.colors.gray,
    },
    rich: {
        minHeight: 240,
        flex: 1,
        borderWidth: 1.5,
        borderTopWidth: 0,
        borderBottomLeftRadius: theme.radius.xl,
        borderBottomRightRadius: theme.radius.xl,
        borderColor: theme.colors.gray,
        padding: 5,
    },
    flatStyle: {
        paddingHorizontal: 8,
        gap: 3,
    }
})