document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/tiles')
        .then(response => response.json())
        .then(result => {
            const container = document.getElementById('list-container');
            
            result.data.forEach(item => {
                const listItem = document.createElement('div');
                listItem.className = 'list-item';
                listItem.textContent = item.content;
                container.appendChild(listItem);
            });
        })
        .catch(error => console.error('Data fetch failure:', error));
});