<template>
  <div>
    <nav>
      <router-link to="/">Login</router-link> |
      <router-link to="/register">Register</router-link>
    </nav>

    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'AuthLayout'
}
</script>
