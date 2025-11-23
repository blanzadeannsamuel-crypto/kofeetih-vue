<template>
    <h3 align="center">Hello world...</h3>
    <h3 align="center"> Hi {{ username }}</h3>
    <p align="center">your token is: {{ token }}</p>
<div align="center">
  <table border="1" bordercolor="black" cellpadding="5" cellspacing="0">
      <thead>
          <tr>
              <th>ID</th>
              <th>Code</th>
              <th>Description</th>
          </tr>
      </thead>
      <tbody>
          <tr v-for="program in programs" v-bind:key="program">
              <td>{{ program.id }}</td>
              <td>{{ program.code }}</td>
              <td>{{ program.description }}</td>
          </tr>
      </tbody>
  </table>

  <button @click="logout()">Logout</button>
</div>
</template>
<script>
import axios from 'axios';  
export default {
  data(){
    return {
      programs: [],
        user: {},
        username: "",
        token: "",
    };
  },
  methods: {
    async fetchProgramList(){
        await axios.get("http://188.1.5.190:8000/api/programs", {
            headers: {
                'Content-Type' : 'application/json',
                Authorization : `Bearer ${this.token}`,
            }
        })
        .then(response => {
            console.log(response.data.data);
            this.programs = response.data.data;
        })
        .catch(error => {
            console.error("Unexpected Error:", error);
        });
    },

    getLoggedUser(){
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        this.user = user; 
        this.username = this.user.name;
      }
    },

    getToken(){
        this.token =localStorage.getItem('token');
    },

    logout() {
        this.token = null
        this.user = null
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        this.$router.push('loginpage');
    },
  },
  mounted() {
    this.getToken();
    this.getLoggedUser();
    this.fetchProgramList();
  },

};

</script>