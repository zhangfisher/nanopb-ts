/* Test program for generated user.pb.c and user.pb.h */

#include "user.pb.h"
#include <stdio.h>

int main() {
    // Initialize a User message
    User_t user = User_t_init_zero;

    // Set some values
    user.id = 123;
    user.has_id = true;

    user.status = STATUS_ACTIVE;
    user.has_status = true;

    // Print the values
    printf("User ID: %d\n", user.id);
    printf("User Status: %d\n", user.status);

    printf("Test passed! Generated code compiles and runs.\n");
    return 0;
}