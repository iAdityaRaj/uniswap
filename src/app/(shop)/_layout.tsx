import {Tabs} from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";

import {FontAwesome} from "@expo/vector-icons"


function TabBarIcon(props: {
    name: React.ComponentProps<typeof FontAwesome>['name'];
    color?: string;
    focused?: boolean;
    size?: number;
}){
    return<FontAwesome size={24} {...props} style={{ color: '#a25353ff'}}/>
}
const TabsLayout = ()=>{

    return (
        <SafeAreaView edges={['top']} style={styles.safeArea}>
            <Tabs screenOptions={{
                tabBarActiveTintColor: "rgba(8, 198, 90, 1)",
                tabBarInactiveTintColor: 'gray',
                tabBarLabelStyle: { fontSize: 16}, 
                tabBarStyle:{
                    borderTopLeftRadius: 20,
                    borderTopRightRadius:20,
                    paddingTop:10
                },
                    
                


            }
            }> 
            <Tabs.Screen name='index' 
            options={{
                title: 'Shop',
                tabBarIcon(props){

                    return <TabBarIcon {...props} name= "shopping-cart" />;
                },
            }}
             />
            <Tabs.Screen name='orders' options={{
                title: 'Orders',
                tabBarIcon(props){

                    return <TabBarIcon {...props} name= "cube" />;
                },
            }} />
        </Tabs>
        </SafeAreaView>
    );
}

export default TabsLayout;


const styles =StyleSheet.create({
    safeArea:{
        flex: 1,
    },
});