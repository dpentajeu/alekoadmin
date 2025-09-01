import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Snackbar,
} from '@mui/material';
import {
  Search,
  Visibility,
  AccountBalance,
  TrendingUp,
  Download,
  Refresh,
  Edit,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { format } from 'date-fns';

const BalanceReport = () => {
  const [users, setUsers] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('balance.coins');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    type: 'system_adjustment',
    amount: { coins: 0, usd: 0 },
    description: '',
  });
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchBalanceData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes] = await Promise.all([
        axios.get(`/balance/users?page=${currentPage}&search=${searchTerm}&sortBy=${sortBy}&sortOrder=${sortOrder}`),
        axios.get('/balance/statistics'),
      ]);

      setUsers(usersRes.data.users);
      setTotalPages(usersRes.data.pagination.total);
      setStatistics(statsRes.data);
    } catch (error) {
      console.error('Error fetching balance data:', error);
      setError('Failed to load balance data');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    fetchBalanceData();
  }, [fetchBalanceData]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchBalanceData();
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleViewDetails = async (user) => {
    setSelectedUser(user);
    setDetailsDialogOpen(true);
    try {
      const response = await axios.get(`/balance/user/${user._id}`);
      setUserDetails(response.data);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleAdjustBalance = async () => {
    if (!adjustForm.description.trim()) {
      setSnackbar({ open: true, message: 'Please provide a description', severity: 'error' });
      return;
    }

    setAdjustLoading(true);
    try {
      await axios.put(`/balance/user/${selectedUser._id}/adjust`, adjustForm);
      setSnackbar({ open: true, message: 'Balance adjusted successfully', severity: 'success' });
      setAdjustDialogOpen(false);
      setAdjustForm({ type: 'system_adjustment', amount: { coins: 0, usd: 0 }, description: '' });
      fetchBalanceData(); // Refresh data
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Failed to adjust balance', 
        severity: 'error' 
      });
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleExport = async (format = 'json') => {
    try {
      const response = await axios.get(`/balance/export?format=${format}`, {
        responseType: format === 'csv' ? 'blob' : 'json',
      });

      if (format === 'csv') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'balance_report.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'balance_report.json');
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Export failed', severity: 'error' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Balance Report
      </Typography>

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Total Coins
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                      {statistics.balanceDistribution.reduce((sum, item) => sum + item.totalCoins, 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <AccountBalance sx={{ fontSize: 32, color: '#1976d2' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Total USD Value
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                      ${statistics.balanceDistribution.reduce((sum, item) => sum + item.totalUsd, 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <TrendingUp sx={{ fontSize: 32, color: '#2e7d32' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Average Balance
                    </Typography>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: '#ed6c02' }}>
                      {statistics.balanceDistribution.length > 0 
                        ? (statistics.balanceDistribution.reduce((sum, item) => sum + item.totalCoins, 0) / 
                           statistics.balanceDistribution.reduce((sum, item) => sum + item.count, 0)).toFixed(0)
                        : 0
                      } coins
                    </Typography>
                  </Box>
                  <AccountBalance sx={{ fontSize: 32, color: '#ed6c02' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Recent Changes
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
                      {statistics.recentChanges.length}
                    </Typography>
                  </Box>
                  <TrendingUp sx={{ fontSize: 32, color: '#9c27b0' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Balance Distribution Chart */}
      {statistics && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Balance Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statistics.balanceDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search Users"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by username, name, or email..."
                InputProps={{
                  endAdornment: (
                    <Button
                      onClick={handleSearch}
                      variant="contained"
                      startIcon={<Search />}
                      sx={{ ml: 1 }}
                    >
                      Search
                    </Button>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="balance.coins">Coins</MenuItem>
                  <MenuItem value="balance.usd">USD</MenuItem>
                  <MenuItem value="createdAt">Join Date</MenuItem>
                  <MenuItem value="lastLogin">Last Login</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Order</InputLabel>
                <Select
                  value={sortOrder}
                  label="Order"
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <MenuItem value="desc">Descending</MenuItem>
                  <MenuItem value="asc">Ascending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3} sx={{ textAlign: 'right' }}>
              <Button
                onClick={() => handleExport('csv')}
                startIcon={<Download />}
                variant="outlined"
                sx={{ mr: 1 }}
              >
                Export CSV
              </Button>
              <Button
                onClick={fetchBalanceData}
                startIcon={<Refresh />}
                variant="outlined"
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            User Balances
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell 
                    onClick={() => handleSort('balance.coins')}
                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                  >
                    Coins Balance
                    {sortBy === 'balance.coins' && (
                      <Typography component="span" sx={{ ml: 1 }}>
                        {sortOrder === 'desc' ? '↓' : '↑'}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell 
                    onClick={() => handleSort('balance.usd')}
                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                  >
                    USD Balance
                    {sortBy === 'balance.usd' && (
                      <Typography component="span" sx={{ ml: 1 }}>
                        {sortOrder === 'desc' ? '↓' : '↑'}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 32, height: 32, mr: 1, fontSize: '0.875rem' }}>
                          {user.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {user.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {user.balance.coins.toLocaleString()} coins
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        ${user.balance.usd.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status}
                        size="small"
                        color={user.status === 'active' ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {user.lastLogin ? format(new Date(user.lastLogin), 'MMM dd, yyyy') : 'Never'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          onClick={() => handleViewDetails(user)}
                          size="small"
                          color="primary"
                          sx={{ mr: 1 }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Adjust Balance">
                        <IconButton
                          onClick={() => {
                            setSelectedUser(user);
                            setAdjustDialogOpen(true);
                          }}
                          size="small"
                          color="secondary"
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(event, value) => setCurrentPage(value)}
              color="primary"
            />
          </Box>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          User Details: {selectedUser?.username}
        </DialogTitle>
        <DialogContent>
          {userDetails ? (
            <Box>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        User Information
                      </Typography>
                      <Typography variant="body2">
                        Username: {userDetails.user.username}
                      </Typography>
                      <Typography variant="body2">
                        Email: {userDetails.user.email}
                      </Typography>
                      <Typography variant="body2">
                        Status: {userDetails.user.status}
                      </Typography>
                      <Typography variant="body2">
                        Created: {format(new Date(userDetails.user.createdAt), 'MMM dd, yyyy')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Current Balance
                      </Typography>
                      <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                        {userDetails.user.balance.coins.toLocaleString()} coins
                      </Typography>
                      <Typography variant="h6" color="text.secondary">
                        ${userDetails.user.balance.usd.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Transactions
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Type</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {userDetails.transactions.map((transaction, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Chip
                                label={transaction.type.replace('_', ' ')}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              {transaction.amount.coins > 0 && `${transaction.amount.coins} coins`}
                              {transaction.amount.usd > 0 && `$${transaction.amount.usd}`}
                            </TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell>
                              {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Box>
          ) : (
            <CircularProgress />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Adjust Balance Dialog */}
      <Dialog
        open={adjustDialogOpen}
        onClose={() => setAdjustDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Adjust Balance: {selectedUser?.username}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Adjustment Type</InputLabel>
              <Select
                value={adjustForm.type}
                label="Adjustment Type"
                onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
              >
                <MenuItem value="deposit">Deposit</MenuItem>
                <MenuItem value="withdrawal">Withdrawal</MenuItem>
                <MenuItem value="system_adjustment">System Adjustment</MenuItem>
              </Select>
            </FormControl>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Coins Amount"
                  type="number"
                  value={adjustForm.amount.coins}
                  onChange={(e) => setAdjustForm({
                    ...adjustForm,
                    amount: { ...adjustForm.amount, coins: parseFloat(e.target.value) || 0 }
                  })}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">coins</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="USD Amount"
                  type="number"
                  value={adjustForm.amount.usd}
                  onChange={(e) => setAdjustForm({
                    ...adjustForm,
                    amount: { ...adjustForm.amount, usd: parseFloat(e.target.value) || 0 }
                  })}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">USD</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={adjustForm.description}
              onChange={(e) => setAdjustForm({ ...adjustForm, description: e.target.value })}
              placeholder="Reason for balance adjustment..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAdjustBalance}
            variant="contained"
            disabled={adjustLoading}
          >
            {adjustLoading ? <CircularProgress size={20} /> : 'Adjust Balance'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BalanceReport;
