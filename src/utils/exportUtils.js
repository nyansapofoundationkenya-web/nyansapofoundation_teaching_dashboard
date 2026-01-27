export function exportData(data, format = 'csv') {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  switch (format) {
    case 'csv':
      exportToCSV(data);
      break;
    case 'excel':
      exportToCSV(data, 'xls');
      break;
    case 'json':
      exportToJSON(data);
      break;
  }
}

function exportToCSV(data, extension = 'csv') {
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).map(value => 
    `"${String(value).replace(/"/g, '""')}"`
  ).join(','));
  const csvContent = [headers, ...rows].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `instructors_${new Date().toISOString().split('T')[0]}.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportToJSON(data) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `instructors_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}