import { View, Text, StyleSheet, TextInput, Alert, TouchableOpacity } from 'react-native'
import React, { useRef, useState } from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import { theme } from '../constants/theme'
import Icon from '../assets/icons'
import { StatusBar } from 'expo-status-bar'
import BackButton from '../components/BackButton'
import { useRouter } from 'expo-router'
import { hp, wp } from '../helpers/common'
import Input from '../components/Input'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'

const SignUp = () => {
    const router = useRouter();
    const emailRef = useRef("");
    const nameRef = useRef("");
    const passwordRef = useRef("");
    const [loading, setLoading] = useState(false);
    const onSubmit = async ()=>{
        if(!emailRef.current || !passwordRef.current){
            Alert.alert('SignUp', "Please fill all the fields!");
            return;
        }

        let name = nameRef.current.trim();
        let email = emailRef.current.trim();
        let password = passwordRef.current.trim();

        setLoading(true);

        const {data: {session}, error} = await supabase.auth.signUp({
            email,
            password,
            options:{
                data:{
                    name
                }
            }
        });

        setLoading(false);

        // console.log('session: ', session);
        // console.log('error: ', error);
        if(error){
            Alert.alert('Sign up', error.message);
        }
    }
    return (
        <ScreenWrapper bg={'white'}>
                <StatusBar style="dark" />
                <View style={styles.container}>
                    <BackButton router={router} />

                    {/* Welcom Text */}
                    <View>
                        <Text style={styles.welcomeText}>Let's</Text>
                        <Text style={styles.welcomeText}>Get Started</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <Text style={{ fontSize: hp(1.5), color: theme.colors.text }}>
                            Please Fill the details to create an account
                        </Text>
                        <Input
                            icon={<Icon name="user" size={26} strokeWidth={1.6} />}
                            placeholder='Enter your name'
                            onChangeText={value => nameRef.current = value}
                        />
                        <Input
                            icon={<Icon name="mail" size={26} strokeWidth={1.6} />}
                            placeholder='Enter your email'
                            onChangeText={value => emailRef.current = value}
                        />
                        <Input
                            icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
                            placeholder='Enter your Password'
                            secureTextEntry
                            onChangeText={value => passwordRef.current = value}
                        />

                        {/* SignUp button*/}
                        <Button title={'SignUp'} loading={loading} onPress={onSubmit} />
                    </View>

                    {/* footer*/}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                        Already have an account!
                        </Text>
                        <TouchableOpacity  onPress={()=> router.push('login')}>
                            <Text style={[{color:theme.colors.primaryDark, fontWeight: theme.fonts.semibold}]}>Log in</Text>
                        </TouchableOpacity >
                    </View>
                </View>
        </ScreenWrapper>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: wp(5),
        gap: 25,
    },
    welcomeText: {
        fontSize: hp(4),
        fontWeight: theme.fonts.bold,
        color: theme.colors.text,
    },
    form: {
        gap: 25,
    },
    // forgotPassword: {
    //     textAlign: 'right',
    //     fontWeight: theme.fonts.semibold,
    //     color: theme.colors.text
    // },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
    },
    footerText: {
        textAlign: 'center',
        color: theme.colors.text,
        fontSize: hp(1.6)
    }
})

export default SignUp