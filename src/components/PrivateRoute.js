import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import AuthService from './AuthService';

const PrivateRoute = ({ component: Component, ...rest }) => (
    <Route {...rest} render={(props) => (
        AuthService.getCurrentUser() ? <Component {...props} /> : <Redirect to="/login" />
    )} />
);

export default PrivateRoute;
