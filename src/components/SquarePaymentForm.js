import React, { useEffect, useRef } from 'react';
import { payments,  } from '@square/web-sdk';

const SquarePaymentForm = ({ onPaymentSuccess }) => {
    const paymentFormRef = useRef();

    useEffect(() => {

        const token = localStorage.getItem('token');
        if (!token) {
            // Redirect to login if not authenticated
            //history.push('/');
        }
        const paymentForm = new payments.Form({
            applicationId: 'sandbox-sq0idb-jNQ__YLJelxD7ZdKJ-MHlg', // Replace with your Square application ID
            inputClass: 'sq-input',
            autoBuild: false,
            cardNumber: {
                elementId: 'sq-card-number',
                placeholder: 'Card Number',
            },
            cvv: {
                elementId: 'sq-cvv',
                placeholder: 'CVV',
            },
            expirationDate: {
                elementId: 'sq-expiration-date',
                placeholder: 'MM/YY',
            },
            postalCode: {
                elementId: 'sq-postal-code',
                placeholder: 'Postal Code',
            },
            callbacks: {
                cardNonceResponseReceived: (errors, nonce, cardData, billingContact, shippingContact) => {
                    if (errors) {
                        console.error(errors);
                        alert('Payment failed');
                    } else {
                        onPaymentSuccess(nonce);
                    }
                },
            },
        });

        paymentForm.build();
        paymentFormRef.current = paymentForm;
    }, [onPaymentSuccess]);

    const requestCardNonce = (e) => {
        e.preventDefault();
        paymentFormRef.current.requestCardNonce();
    };

    return (
        <div>
            <div id="sq-card-number"></div>
            <div id="sq-cvv"></div>
            <div id="sq-expiration-date"></div>
            <div id="sq-postal-code"></div>
            <button onClick={requestCardNonce}>Buy Chips</button>
        </div>
    );
};

export default SquarePaymentForm;
