
describe('User Management E2E', () => {
  beforeEach(() => {
    cy.visit('/users');
    cy.login('admin', 'password'); // Custom command
  });

  it('should create a new user successfully', () => {
    cy.get('[data-testid="create-user-btn"]').click();
    
    cy.get('[data-testid="username-input"]').type('newuser');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="role-select"]').select('farmer');
    cy.get('[data-testid="contact-input"]').type('1234567890');
    
    cy.get('[data-testid="submit-btn"]').click();
    
    cy.get('[data-testid="success-message"]').should('contain', 'User created successfully');
    cy.get('[data-testid="users-table"]').should('contain', 'newuser');
  });

  it('should handle validation errors', () => {
    cy.get('[data-testid="create-user-btn"]').click();
    cy.get('[data-testid="submit-btn"]').click();
    
    cy.get('[data-testid="username-error"]').should('contain', 'Username is required');
    cy.get('[data-testid="password-error"]').should('contain', 'Password is required');
  });

  it('should edit user information', () => {
    cy.get('[data-testid="user-row"]').first().find('[data-testid="edit-btn"]').click();
    
    cy.get('[data-testid="contact-input"]').clear().type('9876543210');
    cy.get('[data-testid="submit-btn"]').click();
    
    cy.get('[data-testid="success-message"]').should('contain', 'User updated successfully');
  });
});
