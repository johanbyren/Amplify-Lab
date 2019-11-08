import API, { graphqlOperation } from '@aws-amplify/api'
import PubSub from '@aws-amplify/pubsub';
import { createTodo } from './graphql/mutations'
import { listTodos } from './graphql/queries'
import { onCreateTodo } from './graphql/subscriptions'
import awsconfig from './aws-exports';
import Amplify, { Auth } from 'aws-amplify';

Amplify.configure(awsconfig);
API.configure(awsconfig);
PubSub.configure(awsconfig);

// Sign up a new user
const CreateUserButton = document.getElementById('registryNewUser');

CreateUserButton.addEventListener('click', (evt) => {
    const username = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    console.log(username, password);
    Auth.signUp({ username, password })
        .then((data) => {
            console.log(data)
            const newUserRegistred = document.getElementById('NewUserRegistred');
            newUserRegistred.innerHTML = `<p>User ${data.user.username} is registred</p>`
        })
        .catch(err => console.log(err));
});

// After retrieving the confirmation code from the user
const ConfirmUserButton = document.getElementById('confirmUserEventButton');

ConfirmUserButton.addEventListener('click', (evt) => {
    const code = document.getElementById('verificationCodeInput').value;
    const username = document.getElementById('emailInput').value;

    Auth.confirmSignUp(username, code, {
        // Optional. Force user confirmation irrespective of existing alias. By default set to True.
        forceAliasCreation: true    
    }).then((data) => {
      console.log(data)
      const confirmedUser = document.getElementById('ConfirmUserRegistred');
      confirmedUser.innerHTML = `<p>User is confirmed</p>`
    })
    .catch(err => console.log(err));
})

// Sign in user
const SignInButton = document.getElementById('SignInEventButton');
SignInButton.addEventListener('click', (evt) => {
  const username = document.getElementById('signInEmailInput').value;
  const password = document.getElementById('signInPasswordInput').value;
  Auth.signIn({username, password})
    .then((data) => {
      console.log(data)
      const confirmedUser = document.getElementById('SignInResult');
      confirmedUser.innerHTML = `<p>You are loged in</p>`
    })
    .catch(err => {
      console.log(err)
      const confirmedUser = document.getElementById('SignInResult');
      confirmedUser.innerHTML = `<p>Something went wrong. Check console.log</p>`
    });
})


// Create an todo. 
async function createNewTodo() {
  const todo = { name: "Use AppSync" , description: "Realtime and Offline"}
  return await API.graphql(graphqlOperation(createTodo, { input: todo }))
}

const MutationButton = document.getElementById('MutationEventButton');
const MutationResult = document.getElementById('MutationResult');

MutationButton.addEventListener('click', async (evt) => {
  try{
    await checkUser();
    MutationResult.innerHTML = `MUTATION RESULTS:`;
    const evt = await createNewTodo();
    MutationResult.innerHTML += `<p>${evt.data.createTodo.name} - ${evt.data.createTodo.description}</p>`
  } catch (err) {
    MutationResult.innerHTML = `<p>You need to login first</p>`
  }
});


// Get all the results and show them
const GetAllDataButton = document.getElementById('getDataEventButton');
const QueryResult = document.getElementById('QueryResult');

GetAllDataButton.addEventListener('click', async (evt) => {
  try{
    await checkUser();
    getData();
  }catch (err){
    QueryResult.innerHTML = `<p>You need to login first</p>`
  }
});

async function getData() {
  QueryResult.innerHTML = `QUERY RESULTS`;
  API.graphql(graphqlOperation(listTodos)).then((evt) => {
    evt.data.listTodos.items.map((todo, i) => 
    QueryResult.innerHTML += `<p>${todo.name} - ${todo.description}</p>`
    );
  })
}

// Create an subscription
const SubscriptionResult = document.getElementById('SubscriptionResult');

API.graphql(graphqlOperation(onCreateTodo)).subscribe({
  next: (evt) =>{
    SubscriptionResult.innerHTML = `SUBSCRIPTION RESULTS`
    const todo = evt.value.data.onCreateTodo;
    SubscriptionResult.innerHTML += `<p>${todo.name} - ${todo.description}</p>`
  }
});





// Sign out user
const SignOutButton = document.getElementById('SignOutEventButton');
SignOutButton.addEventListener('click', (evt) => {
  Auth.signOut()
    .then((data) => {
      console.log(data)
      const confirmedUser = document.getElementById('SignOutResult');
      confirmedUser.innerHTML = `<p>You have logged out</p>`
    })
    .catch(err => {
      console.log(err)
      const confirmedUser = document.getElementById('SignOutResult');
      confirmedUser.innerHTML = `<p>Something went wrong. Check console.log</p>`
    });
})


// Check if user is logged in or not
const checkUserButton = document.getElementById('CheckUserEventButton');
const confirmedUser = document.getElementById('CheckUserResult');

checkUserButton.addEventListener('click', async (evt) => {
  try{
    const checkedUser = await checkUser()
    console.log('kul: ', checkUser);
  
    if(checkedUser != null) {
      confirmedUser.innerHTML += 
      `<h3>User information:</h3>` +
      `<div>Email: ${checkedUser.attributes.email}</div>` +
      `<div>Email verified: ${checkedUser.attributes.email_verified}</div>` +
      `<div>User name: ${checkedUser.username}</div>`;  
    } else {
      confirmedUser.innerHTML = `<p>User information: ${checkedUser}</p>`;
    }
  } catch (err) {
    console.log('Not logged in');
    confirmedUser.innerHTML = `<p>No user is logged in</p>`;
  }

});


async function checkUser() {
  const user = await Auth.currentAuthenticatedUser({bypassCache: false});
  
  if(user){
    console.log('OK. This is your user: ', user)
  } else {
    console.log('Not authorized: ', user);
  }
  return user;
}