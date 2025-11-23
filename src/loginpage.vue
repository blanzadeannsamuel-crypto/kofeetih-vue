<template>
    <div class="container">
        <form autocomplete="on" @submit.prevent="login">
            <div class="form-group">
                <h3>Log in</h3>
                <label for="email">Email:</label>
                <input type="email" id="email"  name="email" v-model="user.email" autocomplete="username" required/>
            </div>

            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password"  name="password" v-model="user.password" autocomplete="current-password" required/>
            </div>

            <button type="submit">Login</button>
        </form>
    </div>
</template>

<script>

import axios from 'axios';


export default {
    data() {
        return {
            user: {
            email: '',
            password: ''
        }
    };
},
methods: {
            async login() {
                try
                {
                const response = await axios.post('http://188.1.5.190:8000/api/login', 
                this.user,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    }
                );
                if (response.status === 200){

                    console.log('Login successful');
                    localStorage.setItem('token', response.data.token);
                    localStorage.setItem('user', JSON.stringify(response.data.user));

                    this.$router.push('program');
                }
            } catch (error) {
                console.error('Login error:', error);
            }
        },
    }
    
}
</script>